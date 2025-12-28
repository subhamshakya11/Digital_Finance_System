from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

from .models import KYCProfile, KYCDocument
from .serializers import KYCProfileSerializer, KYCDocumentSerializer
from .notifications import notify_user

# ----------------- KYC ViewSet ----------------- #


class KYCProfileViewSet(viewsets.ModelViewSet):
    serializer_class = KYCProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'customer':
            return KYCProfile.objects.filter(user=user)
        elif user.user_type in ['admin', 'sales_rep']:
            return KYCProfile.objects.all()
        return KYCProfile.objects.none()
    
    def perform_create(self, serializer):
        """Create or update KYC profile for current user"""
        user = self.request.user
        existing = KYCProfile.objects.filter(user=user).first()
        
        try:
            if existing:
                # If a skeleton profile exists (from doc upload), update it instead of erroring
                serializer.instance = existing
                serializer.save()
            else:
                serializer.save(user=user, status='incomplete')
        except Exception as e:
            print(f"DATABASE ERROR in perform_create: {str(e)}")
            raise e
    
    def perform_update(self, serializer):
        """Update KYC profile"""
        kyc_profile = self.get_object()
        
        # Customers can only update their own incomplete or rejected KYC
        if self.request.user.user_type == 'customer':
            if kyc_profile.status not in ['incomplete', 'rejected']:
                raise serializers.ValidationError({
                    "error": f"Cannot update KYC in {kyc_profile.status} status"
                })
        
        # Clean up numeric fields that might come as empty strings
        # Note: DRF might have already handled this if DecimalField(allow_null=True)
        # but we ensure it here nonetheless.
        data = serializer.validated_data
        if 'annual_income' in data and data['annual_income'] == '':
            data['annual_income'] = None
            
        try:
            serializer.save()
        except Exception as e:
            print(f"DATABASE ERROR in perform_update: {str(e)}")
            raise e
    
    @action(detail=False, methods=['get'])
    def my_kyc(self, request):
        """Get current user's KYC profile"""
        try:
            kyc_profile = KYCProfile.objects.get(user=request.user)
            serializer = self.get_serializer(kyc_profile)
            return Response(serializer.data)
        except KYCProfile.DoesNotExist:
            return Response({
                'status': 'not_found',
                'message': 'No KYC profile found. Please create one.'
            }, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['get'])
    def check_status(self, request):
        """Check KYC status for current user"""
        try:
            kyc_profile = KYCProfile.objects.get(user=request.user)
            return Response({
                'kyc_status': kyc_profile.status,
                'kyc_exists': True,
                'can_apply_loan': kyc_profile.status == 'verified',
                'rejection_reason': kyc_profile.rejection_reason if kyc_profile.status == 'rejected' else None
            })
        except KYCProfile.DoesNotExist:
            return Response({
                'kyc_status': 'incomplete',
                'kyc_exists': False,
                'can_apply_loan': False
            })
    
    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Submit KYC for verification"""
        kyc_profile = self.get_object()
        
        # Only allow submission if status is incomplete or rejected
        if kyc_profile.status not in ['incomplete', 'rejected']:
            return Response({
                'error': f'KYC is already {kyc_profile.status}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if all mandatory documents are uploaded
        mandatory_docs = ['citizenship_front', 'citizenship_back', 'photo']
        uploaded_docs = kyc_profile.documents.values_list('document_type', flat=True)
        missing_docs = [doc for doc in mandatory_docs if doc not in uploaded_docs]
        
        if missing_docs:
            return Response({
                'error': 'All mandatory documents must be uploaded',
                'missing_documents': missing_docs
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Submit for verification
        kyc_profile.status = 'pending'
        kyc_profile.submitted_at = timezone.now()
        kyc_profile.save()
        
        notify_user(
            user=kyc_profile.user,
            title='KYC Submitted',
            message='Your KYC has been submitted for verification. You will be notified once it is reviewed.'
        )
        
        return Response({
            'message': 'KYC submitted successfully',
            'status': kyc_profile.status
        })
    
    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """Verify KYC (Sales Rep/Admin only)"""
        if request.user.user_type not in ['admin', 'sales_rep']:
            return Response({
                'error': 'Only sales representatives and admins can verify KYC'
            }, status=status.HTTP_403_FORBIDDEN)
        
        kyc_profile = self.get_object()
        action_type = request.data.get('action')  # 'approve' or 'reject'
        notes = request.data.get('notes', '')
        
        if action_type == 'approve':
            kyc_profile.status = 'verified'
            kyc_profile.verified_by = request.user
            kyc_profile.verified_at = timezone.now()
            kyc_profile.verification_notes = notes
            kyc_profile.save()
            
            notify_user(
                user=kyc_profile.user,
                title='KYC Verified ✓',
                message='Your KYC has been verified successfully. You can now apply for loans.'
            )
            
            return Response({'message': 'KYC verified successfully'})
        
        elif action_type == 'reject':
            reason = request.data.get('reason', 'Not specified')
            kyc_profile.status = 'rejected'
            kyc_profile.rejection_reason = reason
            kyc_profile.verification_notes = notes
            kyc_profile.save()
            
            notify_user(
                user=kyc_profile.user,
                title='KYC Rejected',
                message=f'Your KYC has been rejected. Reason: {reason}. Please update and resubmit.'
            )
            
            return Response({'message': 'KYC rejected'})
        
        return Response({
            'error': 'Invalid action. Use "approve" or "reject"'
        }, status=status.HTTP_400_BAD_REQUEST)


class KYCDocumentViewSet(viewsets.ModelViewSet):
    serializer_class = KYCDocumentSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'customer':
            try:
                kyc_profile = KYCProfile.objects.get(user=user)
                return KYCDocument.objects.filter(kyc_profile=kyc_profile)
            except KYCProfile.DoesNotExist:
                return KYCDocument.objects.none()
        elif user.user_type in ['admin', 'finance_manager']:
            return KYCDocument.objects.all()
        return KYCDocument.objects.none()
    
    def create(self, request, *args, **kwargs):
        """Upload KYC document"""
        # Get or create KYC profile for user
        kyc_profile = KYCProfile.objects.filter(user=request.user).first()
        if not kyc_profile:
            # If no profile exists, creating one via document upload is risky 
            # as it might lack required fields. But if we must:
            kyc_profile = KYCProfile.objects.create(
                user=request.user,
                full_name=request.user.get_full_name() or request.user.username,
                phone=request.user.phone or "Not Provided",
                email=request.user.email,
                date_of_birth=timezone.now().date(), # Placeholder
                father_name="Pending", # Placeholder
                mother_name="Pending", # Placeholder
                grandfather_name="Pending", # Placeholder
                gender="other", # Placeholder
                permanent_address="Pending", # Placeholder
                permanent_district="Pending", # Placeholder
                permanent_province="Bagmati Province", # Placeholder
                citizenship_number=f"TEMP-{request.user.id}", # Temp unique
                citizenship_issue_date=timezone.now().date(), # Placeholder
                citizenship_issue_district="Pending", # Placeholder
                occupation="Pending", # Placeholder
                status='incomplete'
            )
        
        # Check if KYC is in editable state
        if kyc_profile.status not in ['incomplete', 'rejected']:
            return Response({
                'error': f'Cannot upload documents. KYC is {kyc_profile.status}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        document_type = request.data.get('document_type')
        file = request.FILES.get('file')
        
        if not document_type or not file:
            return Response({
                'error': 'document_type and file are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check for duplicate document type
        if KYCDocument.objects.filter(kyc_profile=kyc_profile, document_type=document_type).exists():
            return Response({
                'error': f'Document of type "{dict(KYCDocument.DOCUMENT_TYPES).get(document_type)}" already uploaded'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create document
        document = KYCDocument.objects.create(
            kyc_profile=kyc_profile,
            document_type=document_type,
            file=file
        )
        
        serializer = self.get_serializer(document)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def verify_document(self, request, pk=None):
        """Verify a KYC document (Sales Rep/Admin only)"""
        if request.user.user_type not in ['admin', 'sales_rep']:
            return Response({
                'error': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        document = self.get_object()
        action_type = request.data.get('action')  # 'approve' or 'reject'
        notes = request.data.get('notes', '')
        
        if action_type == 'approve':
            document.status = 'verified'
            document.verified_by = request.user
            document.verified_at = timezone.now()
            document.verification_notes = notes
            document.save()
            return Response({'message': 'Document verified'})
        
        elif action_type == 'reject':
            document.status = 'rejected'
            document.verification_notes = notes
            document.save()
            return Response({'message': 'Document rejected'})
        
        return Response({
            'error': 'Invalid action'
        }, status=status.HTTP_400_BAD_REQUEST)
