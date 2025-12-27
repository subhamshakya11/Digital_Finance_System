from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.utils import timezone
from django.db.models import Q
from datetime import timedelta
from decimal import Decimal
import math

from .models import (
    User, Vehicle, LoanApplication, Document, 
    EMISchedule, Payment
)
from .serializers import (
    UserSerializer, VehicleSerializer, LoanApplicationSerializer,
    DocumentSerializer, EMIScheduleSerializer, PaymentSerializer,
    NotificationSerializer
)
from ai_engine.credit_scorer import CreditScorer
from ai_engine.fraud_detector import FraudDetector

# Updated import for notifications
from .notifications import notify_user


# ----------------- Authentication Views ----------------- #

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    user = authenticate(username=username, password=password)
    if user:
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        })
    return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profile(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    serializer = UserSerializer(request.user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.user_type != 'admin':
            return User.objects.none()
        return User.objects.all().order_by('-date_joined')
        
    def create(self, request, *args, **kwargs):
        if request.user.user_type != 'admin':
            return Response({'error': 'Only admins can create users'}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)
        
    def destroy(self, request, *args, **kwargs):
        if request.user.user_type != 'admin':
             return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

# ----------------- Vehicle ViewSet ----------------- #

class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'brand', 'model', 'vehicle_type']
    ordering_fields = ['price', 'created_at']
    
    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.user_type in ['admin', 'sales_rep']:
            return Vehicle.objects.all()
        return Vehicle.objects.filter(is_available=True)
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        # Only admin and sales_rep can create/update/delete vehicles
        return [IsAuthenticated()]
    
    def perform_create(self, serializer):
        if self.request.user.user_type not in ['admin', 'sales_rep']:
            raise serializers.ValidationError({"error": "Only admins and sales reps can add vehicles"})
        serializer.save()

    def perform_update(self, serializer):
        if self.request.user.user_type not in ['admin', 'sales_rep']:
            raise serializers.ValidationError({"error": "Only admins and sales reps can update vehicles"})
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user.user_type not in ['admin', 'sales_rep']:
            raise serializers.ValidationError({"error": "Only admins and sales reps can delete vehicles"})
        instance.delete()
    
    @action(detail=False, methods=['get'])
    def filter_by_type(self, request):
        vehicle_type = request.query_params.get('type')
        vehicles = self.queryset.filter(vehicle_type=vehicle_type)
        serializer = self.get_serializer(vehicles, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def filter_by_price(self, request):
        min_price = request.query_params.get('min_price', 0)
        max_price = request.query_params.get('max_price', 999999999)
        vehicles = self.queryset.filter(price__gte=min_price, price__lte=max_price)
        serializer = self.get_serializer(vehicles, many=True)
        return Response(serializer.data)


# ----------------- Loan Application ViewSet ----------------- #

class LoanApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = LoanApplicationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'customer':
            return LoanApplication.objects.filter(customer=user)
        elif user.user_type in ['sales_rep', 'finance_manager', 'admin']:
            return LoanApplication.objects.all()
        return LoanApplication.objects.none()
    
    def perform_create(self, serializer):
        # Create loan as draft - user must upload documents before submission
        loan = serializer.save(customer=self.request.user, status='draft')
        self.calculate_emi(loan)
        notify_user(
            user=loan.customer,
            title='Loan Application Created',
            message=f'Your loan application {loan.application_number} has been created. Please upload all required documents to submit it.'
        )
    
    def calculate_emi(self, loan):
        P = float(loan.loan_amount)
        r = float(loan.interest_rate) / (12 * 100)
        n = loan.tenure_months
        
        emi = P * r * math.pow(1 + r, n) / (math.pow(1 + r, n) - 1)
        loan.monthly_emi = round(Decimal(emi), 2)
        loan.save()
        self.generate_emi_schedule(loan)
    
    def generate_emi_schedule(self, loan):
        # Delete existing EMI schedules to prevent duplicates
        EMISchedule.objects.filter(application=loan).delete()
        
        remaining_balance = float(loan.loan_amount)
        monthly_rate = float(loan.interest_rate) / (12 * 100)
        emi_amount = float(loan.monthly_emi)
        
        for i in range(1, loan.tenure_months + 1):
            interest = remaining_balance * monthly_rate
            principal = emi_amount - interest
            remaining_balance -= principal
            
            due_date = timezone.now().date() + timedelta(days=30 * i)
            
            EMISchedule.objects.create(
                application=loan,
                emi_number=i,
                due_date=due_date,
                emi_amount=loan.monthly_emi,
                principal_amount=round(Decimal(principal), 2),
                interest_amount=round(Decimal(interest), 2),
                remaining_balance=max(round(Decimal(remaining_balance), 2), Decimal(0))
            )
    
    @action(detail=True, methods=['post'])
    def submit_loan(self, request, pk=None):
        """Submit a draft loan application after documents are uploaded"""
        loan = self.get_object()
        
        # Check if loan is in draft status
        if loan.status != 'draft':
            return Response({
                'error': f'Loan is already {loan.status}. Only draft loans can be submitted.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if all mandatory documents are uploaded
        doc_status = Document.check_mandatory_documents(loan)
        
        if not doc_status['complete']:
            return Response({
                'error': 'All mandatory documents must be uploaded before submission',
                'missing_documents': doc_status['missing'],
                'missing_labels': [
                    dict(Document.DOCUMENT_TYPES).get(doc_type, doc_type) 
                    for doc_type in doc_status['missing']
                ]
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Submit the loan
        loan.status = 'submitted'
        loan.submitted_at = timezone.now()
        loan.save()
        
        notify_user(
            user=loan.customer,
            title='Loan Application Submitted',
            message=f'Your loan application {loan.application_number} has been submitted successfully and is now under review.'
        )
        
        return Response({
            'message': 'Loan application submitted successfully',
            'loan': LoanApplicationSerializer(loan).data
        })
    
    @action(detail=True, methods=['post'])
    def verify_documents(self, request, pk=None):
        loan = self.get_object()
        if request.user.user_type not in ['sales_rep', 'admin']:
            return Response({'error': 'Only sales representatives or admins can verify documents'}, status=status.HTTP_403_FORBIDDEN)
        
        loan.status = 'documents_verified'
        loan.verified_by = request.user
        loan.verified_at = timezone.now()
        loan.save()
        
        notify_user(
            user=loan.customer,
            title='Documents Verified',
            message=f'Your documents for application {loan.application_number} have been verified.'
        )
        
        return Response({'message': 'Documents verified successfully'})
    
    @action(detail=True, methods=['post'])
    def ai_score(self, request, pk=None):
        loan = self.get_object()
        
        # 1. Credit Scoring
        scorer = CreditScorer()
        score, risk_level, recommendation = scorer.score_application(loan)
        
        # 2. Fraud Detection
        detector = FraudDetector()
        fraud_result = detector.comprehensive_fraud_check(loan)
        
        # 3. Merge Results
        if fraud_result['is_suspicious']:
            risk_level = 'high'
            recommendation = "🚨 SUSPECTED FRAUD DETECTED:\n" + \
                             "\n".join([f"- {flag}" for flag in fraud_result['fraud_flags']]) + \
                             "\n\n" + recommendation
        
        loan.credit_score = score
        loan.fraud_risk_level = risk_level
        loan.ai_recommendation = recommendation
        loan.save()
        
        return Response({
            'credit_score': score,
            'risk_level': risk_level,
            'recommendation': recommendation,
            'fraud_analysis': fraud_result
        })
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        loan = self.get_object()
        if request.user.user_type not in ['finance_manager', 'admin']:
            return Response({'error': 'Only finance managers can approve loans'}, status=status.HTTP_403_FORBIDDEN)
        
        loan.status = 'approved'
        loan.approved_by = request.user
        loan.approved_at = timezone.now()
        loan.save()
        
        notify_user(
            user=loan.customer,
            title='Loan Approved! 🎉',
            message=f'Congratulations! Your loan application {loan.application_number} has been approved.'
        )
        
        return Response({'message': 'Loan approved successfully'})
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        loan = self.get_object()
        if request.user.user_type not in ['finance_manager', 'admin']:
            return Response({'error': 'Only finance managers can reject loans'}, status=status.HTTP_403_FORBIDDEN)
        
        reason = request.data.get('reason', '')
        loan.status = 'rejected'
        loan.rejection_reason = reason
        loan.save()
        
        notify_user(
            user=loan.customer,
            title='Loan Application Rejected',
            message=f'Your loan application {loan.application_number} has been rejected. Reason: {reason}'
        )
        
        return Response({'message': 'Loan rejected'})


# ----------------- Document ViewSet ----------------- #

class DocumentViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]  # Enable file upload
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'customer':
            return Document.objects.filter(application__customer=user)
        return Document.objects.all()
    
    def create(self, request, *args, **kwargs):
        """Custom create method with validation"""
        application_id = request.data.get('application')
        document_type = request.data.get('document_type')
        file = request.FILES.get('file')
        
        # Validate required fields
        if not all([application_id, document_type, file]):
            return Response({
                'error': 'Missing required fields: application, document_type, and file are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if application exists and belongs to user
        try:
            application = LoanApplication.objects.get(id=application_id)
            if request.user.user_type == 'customer' and application.customer != request.user:
                return Response({
                    'error': 'You can only upload documents for your own applications'
                }, status=status.HTTP_403_FORBIDDEN)
        except LoanApplication.DoesNotExist:
            return Response({
                'error': 'Loan application not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Check for duplicate document type
        if Document.objects.filter(application=application, document_type=document_type).exists():
            return Response({
                'error': f'A document of type "{dict(Document.DOCUMENT_TYPES).get(document_type)}" has already been uploaded for this application'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create the document
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def required_documents(self, request):
        """Get list of all document types with mandatory flags"""
        documents = Document.get_required_documents()
        return Response(documents)
    
    @action(detail=False, methods=['get'])
    def upload_status(self, request):
        """Check document upload status for a specific application"""
        application_id = request.query_params.get('application')
        
        if not application_id:
            return Response({
                'error': 'application parameter is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            application = LoanApplication.objects.get(id=application_id)
            if request.user.user_type == 'customer' and application.customer != request.user:
                return Response({
                    'error': 'Permission denied'
                }, status=status.HTTP_403_FORBIDDEN)
            
            status_info = Document.check_mandatory_documents(application)
            
            # Add document type labels
            all_docs = Document.get_required_documents()
            doc_labels = {doc['type']: doc['label'] for doc in all_docs}
            
            status_info['missing_labels'] = [
                doc_labels.get(doc_type, doc_type) for doc_type in status_info['missing']
            ]
            
            return Response(status_info)
        except LoanApplication.DoesNotExist:
            return Response({
                'error': 'Loan application not found'
            }, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        document = self.get_object()
        if request.user.user_type not in ['sales_rep', 'admin']:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        status_val = request.data.get('status', 'verified')
        if status_val not in ['verified', 'rejected']:
             return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)

        document.status = status_val
        if status_val == 'verified':
            document.verified_by = request.user
            document.verified_at = timezone.now()
        
        document.verification_notes = request.data.get('notes', '')
        document.save()
        return Response({'message': f'Document {status_val}'})


# ----------------- EMI Schedule ViewSet ----------------- #

class EMIScheduleViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = EMIScheduleSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        # Only show EMI schedules for approved or disbursed loans
        queryset = EMISchedule.objects.filter(application__status__in=['approved', 'disbursed'])
        
        if user.user_type == 'customer':
            queryset = queryset.filter(application__customer=user)
            
        # Filter by application if provided
        application_id = self.request.query_params.get('application')
        if application_id:
            queryset = queryset.filter(application_id=application_id)
            
        return queryset
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        today = timezone.now().date()
        upcoming = self.get_queryset().filter(
            status='pending',
            due_date__gte=today
        ).order_by('due_date')[:5]
        serializer = self.get_serializer(upcoming, many=True)
        return Response(serializer.data)


# ----------------- Payment ViewSet ----------------- #

class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'customer':
            return Payment.objects.filter(emi_schedule__application__customer=user)
        return Payment.objects.all()
    
    def perform_create(self, serializer):
        # Save the payment
        payment = serializer.save()
        
        # Update the EMI schedule status
        emi_schedule = payment.emi_schedule
        emi_schedule.status = 'paid'
        emi_schedule.paid_amount = payment.amount
        emi_schedule.paid_date = timezone.now().date()
        emi_schedule.save()
        
        # Notify the user
        notify_user(
            user=emi_schedule.application.customer,
            title='Payment Received',
            message=f'Your payment of NPR {payment.amount} for EMI #{emi_schedule.emi_number} has been recorded successfully.'
        )


# ----------------- Notification ViewSet ----------------- #

from .models import Notification

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'message': 'Marked as read'})
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        self.get_queryset().update(is_read=True)
        return Response({'message': 'All notifications marked as read'})


# ----------------- Dashboard Statistics ----------------- #

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    user = request.user
    
    if user.user_type == 'customer':
        stats = {
            'total_applications': LoanApplication.objects.filter(customer=user).count(),
            'approved_loans': LoanApplication.objects.filter(customer=user, status='approved').count(),
            'pending_applications': LoanApplication.objects.filter(
                customer=user, status__in=['submitted', 'under_review']
            ).count(),
            'total_emi_paid': Payment.objects.filter(
                emi_schedule__application__customer=user
            ).count(),
        }
    elif user.user_type == 'admin':
        stats = {
            'total_applications': LoanApplication.objects.count(),
            'pending_verifications': LoanApplication.objects.filter(status='submitted').count(),
            'approved_today': LoanApplication.objects.filter(
                approved_at__date=timezone.now().date()
            ).count(),
            'total_customers': User.objects.filter(user_type='customer').count(),
        }
    else:
        stats = {
            'pending_tasks': LoanApplication.objects.filter(
                Q(status='submitted') | Q(status='under_review')
            ).count()
        }
    
    return Response(stats)
