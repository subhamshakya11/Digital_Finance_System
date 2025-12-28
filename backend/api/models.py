from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid

class User(AbstractUser):
    """Extended User Model"""
    USER_TYPES = (
        ('customer', 'Customer'),
        ('sales_rep', 'Sales Representative'),
        ('finance_manager', 'Finance Manager'),
        ('admin', 'Admin'),
    )
    
    KYC_STATUS_CHOICES = (
        ('incomplete', 'Incomplete'),
        ('pending', 'Pending Verification'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
    )
    
    user_type = models.CharField(max_length=20, choices=USER_TYPES, default='customer')
    kyc_status = models.CharField(max_length=20, choices=KYC_STATUS_CHOICES, default='incomplete')
    
    # Make email and phone REQUIRED for notifications
    email = models.EmailField(unique=True)  # Required and unique
    phone = models.CharField(max_length=15)  # Required
    
    address = models.TextField(blank=True, null=True)
    citizenship_number = models.CharField(max_length=50, blank=True, null=True)
    date_of_birth = models.DateField(null=True, blank=True)
    profile_picture = models.ImageField(upload_to='profiles/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'users'
    
    def __str__(self):
        return f"{self.username} ({self.get_user_type_display()})"


class Vehicle(models.Model):
    """Vehicle Model"""
    VEHICLE_TYPES = (
        ('two_wheeler', 'Two Wheeler (Bike/Scooter)'),
        ('three_wheeler', 'Three Wheeler (Auto/Rickshaw)'),
        ('car', 'Car (Sedan/Hatchback)'),
        ('suv', 'SUV/Jeep'),
        ('van', 'Van/Microbus'),
        ('truck', 'Truck'),
        ('bus', 'Bus'),
    )
    
    FUEL_TYPES = (
        ('petrol', 'Petrol'),
        ('diesel', 'Diesel'),
        ('electric', 'Electric'),
        ('hybrid', 'Hybrid'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    brand = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    year = models.IntegerField()
    vehicle_type = models.CharField(max_length=20, choices=VEHICLE_TYPES)
    fuel_type = models.CharField(max_length=20, choices=FUEL_TYPES)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='vehicles/', null=True, blank=True)
    is_available = models.BooleanField(default=True)
    max_loan_percentage = models.IntegerField(default=80, validators=[MinValueValidator(0), MaxValueValidator(100)])
    
    # Technical Specifications
    top_speed = models.IntegerField(null=True, blank=True, help_text="Top speed in km/h")
    mileage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="Mileage in km/l")
    fuel_tank_capacity = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="Fuel tank capacity in Liters")
    horsepower = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, help_text="Horsepower in bhp")
    engine_capacity = models.IntegerField(null=True, blank=True, help_text="Engine capacity in cc")
    fuel_system = models.CharField(max_length=50, choices=(('fi', 'Fuel Injection (FI)'), ('carburetor', 'Carburetor')), default='fi', null=True, blank=True)
    
    # Safety and Features
    abs_status = models.BooleanField(default=False, verbose_name="Has ABS")
    cbs_status = models.BooleanField(default=False, verbose_name="Has CBS")
    brake_type = models.CharField(max_length=50, choices=(('disc', 'Disc'), ('drum', 'Drum'), ('both', 'Both Disc')), default='disc')
    wheel_size = models.CharField(max_length=50, blank=True, null=True)
    color = models.CharField(max_length=50, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'vehicles'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.brand} {self.model} ({self.year})"


class LoanApplication(models.Model):
    """Loan Application Model"""
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('under_review', 'Under Review'),
        ('documents_verified', 'Documents Verified'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('disbursed', 'Disbursed'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application_number = models.CharField(max_length=20, unique=True, editable=False)
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='loan_applications')
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='loan_applications')
    
    loan_amount = models.DecimalField(max_digits=12, decimal_places=2)
    down_payment = models.DecimalField(max_digits=12, decimal_places=2)
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2, default=11.0)
    tenure_months = models.IntegerField(validators=[MinValueValidator(6), MaxValueValidator(120)])
    monthly_emi = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    monthly_income = models.DecimalField(max_digits=12, decimal_places=2)
    employment_type = models.CharField(max_length=50)
    employer_name = models.CharField(max_length=200, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='verified_applications')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_applications')
    
    credit_score = models.IntegerField(null=True, blank=True)
    fraud_risk_level = models.CharField(max_length=20, blank=True)
    ai_recommendation = models.TextField(blank=True)
    
    customer_remarks = models.TextField(blank=True)
    admin_remarks = models.TextField(blank=True)
    rejection_reason = models.TextField(blank=True)
    
    submitted_at = models.DateTimeField(null=True, blank=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'loan_applications'
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        if not self.application_number:
            import random
            self.application_number = f"LA{random.randint(100000, 999999)}"
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.application_number} - {self.customer.username}"


class Document(models.Model):
    """Document Model for KYC"""
    DOCUMENT_TYPES = (
        ('citizenship', 'Citizenship Certificate'),
        ('license', 'Driving License'),
        ('pan', 'PAN Card'),
        ('bank_statement', 'Bank Statement'),
        ('salary_slip', 'Salary Slip'),
        ('passport_photo', 'Passport Size Photos'),
        ('tax_clearance', 'Tax Clearance Certificate'),
        ('passport', 'Passport'),
        ('other', 'Other'),
    )
    
    # Mandatory documents required for loan submission
    MANDATORY_DOCUMENTS = ['citizenship', 'license', 'bank_statement', 'salary_slip']
    
    STATUS_CHOICES = (
        ('pending', 'Pending Verification'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application = models.ForeignKey(LoanApplication, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPES)
    file = models.FileField(upload_to='documents/%Y/%m/')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    verification_notes = models.TextField(blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'documents'
        ordering = ['-uploaded_at']
        # Prevent duplicate document types for the same application
        unique_together = ['application', 'document_type']
    
    def __str__(self):
        return f"{self.get_document_type_display()} - {self.application.application_number}"
    
    @classmethod
    def get_required_documents(cls):
        """Return list of all document types with mandatory flag"""
        return [
            {
                'type': doc_type,
                'label': doc_label,
                'mandatory': doc_type in cls.MANDATORY_DOCUMENTS
            }
            for doc_type, doc_label in cls.DOCUMENT_TYPES
        ]
    
    @classmethod
    def check_mandatory_documents(cls, application):
        """Check if all mandatory documents are uploaded for an application"""
        uploaded_types = application.documents.values_list('document_type', flat=True)
        missing = [doc for doc in cls.MANDATORY_DOCUMENTS if doc not in uploaded_types]
        return {
            'complete': len(missing) == 0,
            'missing': missing,
            'uploaded': list(uploaded_types)
        }


class EMISchedule(models.Model):
    """EMI Schedule Model"""
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('partial', 'Partially Paid'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application = models.ForeignKey(LoanApplication, on_delete=models.CASCADE, related_name='emi_schedules')
    emi_number = models.IntegerField()
    due_date = models.DateField()
    emi_amount = models.DecimalField(max_digits=10, decimal_places=2)
    principal_amount = models.DecimalField(max_digits=10, decimal_places=2)
    interest_amount = models.DecimalField(max_digits=10, decimal_places=2)
    remaining_balance = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    paid_date = models.DateField(null=True, blank=True)
    
    class Meta:
        db_table = 'emi_schedules'
        ordering = ['emi_number']
        unique_together = ['application', 'emi_number']
    
    def __str__(self):
        return f"EMI {self.emi_number} - {self.application.application_number}"


class Payment(models.Model):
    """Payment Model"""
    PAYMENT_METHODS = (
        ('esewa', 'eSewa'),
        ('khalti', 'Khalti'),
        ('bank_transfer', 'Bank Transfer'),
        ('cash', 'Cash'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    emi_schedule = models.ForeignKey(EMISchedule, on_delete=models.CASCADE, related_name='payments')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    transaction_id = models.CharField(max_length=100, unique=True)
    payment_date = models.DateTimeField(auto_now_add=True)
    remarks = models.TextField(blank=True)
    
    class Meta:
        db_table = 'payments'
        ordering = ['-payment_date']
    
    def __str__(self):
        return f"Payment {self.transaction_id} - NPR {self.amount}"


class Notification(models.Model):
    """Notification Model"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.user.username}"


class ChatMessage(models.Model):
    """Chat Message Model for Chatbot"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_messages')
    message = models.TextField()
    response = models.TextField()
    intent = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'chat_messages'
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.created_at}"


class KYCProfile(models.Model):
    """KYC Profile Model for Customer Verification"""
    STATUS_CHOICES = (
        ('incomplete', 'Incomplete'),
        ('pending', 'Pending Verification'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='kyc_profile')
    
    # Personal Information
    full_name = models.CharField(max_length=200)
    father_name = models.CharField(max_length=200)
    mother_name = models.CharField(max_length=200)
    grandfather_name = models.CharField(max_length=200)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=10, choices=(('male', 'Male'), ('female', 'Female'), ('other', 'Other')))
    
    # Address Information
    permanent_address = models.TextField()
    permanent_district = models.CharField(max_length=100)
    permanent_province = models.CharField(max_length=100)
    temporary_address = models.TextField(blank=True, null=True)
    temporary_district = models.CharField(max_length=100, blank=True, null=True)
    temporary_province = models.CharField(max_length=100, blank=True, null=True)
    
    # Contact Information
    phone = models.CharField(max_length=15)
    alternate_phone = models.CharField(max_length=15, blank=True, null=True)
    email = models.EmailField()
    
    # Identification Numbers
    citizenship_number = models.CharField(max_length=50, unique=True)
    citizenship_issue_date = models.DateField()
    citizenship_issue_district = models.CharField(max_length=100)
    
    pan_number = models.CharField(max_length=20, unique=True, blank=True, null=True)
    license_number = models.CharField(max_length=50, blank=True, null=True)
    passport_number = models.CharField(max_length=50, blank=True, null=True)
    
    # Occupation
    occupation = models.CharField(max_length=100)
    employer_name = models.CharField(max_length=200, blank=True, null=True)
    annual_income = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    
    # Status and Verification
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='incomplete')
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='verified_kyc_profiles')
    verification_notes = models.TextField(blank=True)
    rejection_reason = models.TextField(blank=True)
    
    # Timestamps
    submitted_at = models.DateTimeField(null=True, blank=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'kyc_profiles'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"KYC - {self.user.username} ({self.get_status_display()})"
    
    def save(self, *args, **kwargs):
        """Update user's kyc_status when KYC profile status changes"""
        super().save(*args, **kwargs)
        if self.user.kyc_status != self.status:
            self.user.kyc_status = self.status
            self.user.save(update_fields=['kyc_status'])


class KYCDocument(models.Model):
    """KYC Document Model for storing KYC-related documents"""
    DOCUMENT_TYPES = (
        ('citizenship_front', 'Citizenship Certificate (Front)'),
        ('citizenship_back', 'Citizenship Certificate (Back)'),
        ('license', 'Driving License'),
        ('pan', 'PAN Card'),
        ('passport', 'Passport'),
        ('photo', 'Passport Size Photo'),
        ('signature', 'Signature'),
    )
    
    STATUS_CHOICES = (
        ('pending', 'Pending Verification'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    kyc_profile = models.ForeignKey(KYCProfile, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=30, choices=DOCUMENT_TYPES)
    file = models.FileField(upload_to='kyc_documents/%Y/%m/')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    verification_notes = models.TextField(blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'kyc_documents'
        ordering = ['-uploaded_at']
        unique_together = ['kyc_profile', 'document_type']
    
    def __str__(self):
        return f"{self.get_document_type_display()} - {self.kyc_profile.user.username}"