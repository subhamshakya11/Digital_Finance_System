from rest_framework import serializers
from .models import (
    User, Vehicle, LoanApplication, Document, 
    EMISchedule, Payment, Notification, ChatMessage,
    KYCProfile, KYCDocument
)

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name', 
                  'user_type', 'kyc_status', 'phone', 'address', 'citizenship_number', 
                  'date_of_birth', 'profile_picture', 'created_at']
        extra_kwargs = {
            'password': {'write_only': True},
            'email': {'required': True},
            'phone': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
        }
    
    def validate_email(self, value):
        """Check if email already exists"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email address is already registered in our system.")
        return value
    
    def validate_username(self, value):
        """Check if username already exists"""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken. Please choose another one.")
        return value
    
    def create(self, validated_data):
        """Create user with hashed password"""
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone=validated_data['phone'],
            user_type=validated_data.get('user_type', 'customer'),
            address=validated_data.get('address', ''),
            citizenship_number=validated_data.get('citizenship_number', ''),
            date_of_birth=validated_data.get('date_of_birth', None),
        )
        return user


class VehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = '__all__'


class DocumentSerializer(serializers.ModelSerializer):
    verified_by_name = serializers.CharField(source='verified_by.get_full_name', read_only=True)
    
    class Meta:
        model = Document
        fields = '__all__'


class EMIScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = EMISchedule
        fields = '__all__'


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'


class LoanApplicationSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.get_full_name', read_only=True)
    customer_kyc_status = serializers.CharField(source='customer.kyc_status', read_only=True)
    vehicle_name = serializers.CharField(source='vehicle.__str__', read_only=True)
    documents = DocumentSerializer(many=True, read_only=True)
    emi_schedules = EMIScheduleSerializer(many=True, read_only=True)

    def validate(self, data):
        """
        Check that loan amount conforms to vehicle max loan percentage
        """
        # Checks for updates (instance exists) or create (no instance)
        # Note: 'vehicle' might be in data (create) or self.instance (update)
        vehicle = data.get('vehicle')
        # If updating and vehicle not changed, get from instance
        if not vehicle and self.instance:
            vehicle = self.instance.vehicle
            
        loan_amount = data.get('loan_amount')
        if not loan_amount and self.instance:
             loan_amount = self.instance.loan_amount

        down_payment = data.get('down_payment')
        if not down_payment and self.instance:
            down_payment = self.instance.down_payment

        monthly_income = data.get('monthly_income')
        if not monthly_income and self.instance:
             monthly_income = self.instance.monthly_income

        if loan_amount is not None and loan_amount <= 0:
            raise serializers.ValidationError({"loan_amount": "Loan amount must be a positive number greater than zero."})
        
        if down_payment is not None and down_payment < 0:
            raise serializers.ValidationError({"down_payment": "Down payment cannot be a negative value."})

        if monthly_income is not None and monthly_income <= 0:
            raise serializers.ValidationError({"monthly_income": "Please provide a valid monthly income greater than zero."})

        if vehicle and loan_amount is not None:
            max_loan = (vehicle.price * vehicle.max_loan_percentage) / 100
            if loan_amount > max_loan:
                raise serializers.ValidationError({
                    "loan_amount": f"Loan amount exceeds the maximum allowed ({vehicle.max_loan_percentage}% of price: {max_loan})"
                })
            
            # Ensure Loan + Down Payment >= Price (roughly)
            # Actually, user can pay MORE down payment, so Loan + Down >= Price is the correct check if expecting full coverage
            # But the user might be financing only a part.
            # However, typically (Loan + Down Payment) should cover the vehicle price.
            if down_payment is not None:
                if (loan_amount + down_payment) < vehicle.price:
                     missing = vehicle.price - (loan_amount + down_payment)
                     raise serializers.ValidationError({
                        "non_field_errors": f"Total financing (Loan + Down Payment) is less than vehicle price by {missing}. Please increase down payment or loan amount."
                    })

        return data
    
    class Meta:
        model = LoanApplication
        fields = '__all__'
        read_only_fields = ['customer', 'application_number', 'interest_rate', 'credit_score', 'fraud_risk_level', 
                           'ai_recommendation', 'verified_by', 'approved_by']


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'



class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = '__all__'


class KYCDocumentSerializer(serializers.ModelSerializer):
    verified_by_name = serializers.CharField(source='verified_by.get_full_name', read_only=True)
    
    class Meta:
        model = KYCDocument
        fields = '__all__'
        read_only_fields = ['verified_by', 'verified_at']


class KYCProfileSerializer(serializers.ModelSerializer):
    documents = KYCDocumentSerializer(many=True, read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    verified_by_name = serializers.CharField(source='verified_by.get_full_name', read_only=True)
    
    class Meta:
        model = KYCProfile
        fields = '__all__'
        read_only_fields = ['user', 'status', 'verified_by', 'verified_at', 'submitted_at']
    
    def validate_citizenship_number(self, value):
        """Check if citizenship number already exists for another user"""
        user = self.context['request'].user
        if KYCProfile.objects.filter(citizenship_number=value).exclude(user=user).exists():
            raise serializers.ValidationError("This citizenship number is already registered.")
        return value
    
    def validate_pan_number(self, value):
        """Check if PAN number already exists for another user"""
        if value and value.strip():
            user = self.context['request'].user
            if KYCProfile.objects.filter(pan_number=value).exclude(user=user).exists():
                raise serializers.ValidationError("This PAN number is already registered.")
            return value
        return None  # Convert empty string to None
    
    def validate_license_number(self, value):
        if value == '': return None
        return value
        
    def validate_passport_number(self, value):
        if value == '': return None
        return value

    def validate(self, data):
        """Additional validation for KYC data"""
        # Ensure date of birth is in the past
        from datetime import date
        if data.get('date_of_birth') and data['date_of_birth'] >= date.today():
            raise serializers.ValidationError({"date_of_birth": "Date of birth must be in the past."})
        
        # Ensure citizenship issue date is in the past
        if data.get('citizenship_issue_date') and data['citizenship_issue_date'] >= date.today():
            raise serializers.ValidationError({"citizenship_issue_date": "Citizenship issue date must be in the past."})
        
        # Clean up numeric fields
        if 'annual_income' in data and data['annual_income'] == '':
            data['annual_income'] = None
            
        return data