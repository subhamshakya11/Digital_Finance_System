from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import (
    User, Vehicle, LoanApplication, Document,
    EMISchedule, Payment, Notification, ChatMessage,
    KYCProfile, KYCDocument
)

class EMIScheduleInline(admin.TabularInline):
    model = EMISchedule
    extra = 0
    readonly_fields = ['emi_number', 'due_date', 'emi_amount', 'status']
    can_delete = False

class KYCDocumentInline(admin.TabularInline):
    model = KYCDocument
    extra = 0
    readonly_fields = ['document_type', 'file', 'status', 'uploaded_at']
    can_delete = False

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'email', 'user_type', 'kyc_status', 'created_at']
    list_filter = ['user_type', 'kyc_status', 'created_at']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ['name', 'brand', 'model', 'vehicle_type', 'price', 'engine_capacity', 'is_available']
    list_filter = ['vehicle_type', 'fuel_type', 'is_available', 'fuel_system', 'brake_type']
    search_fields = ['name', 'brand', 'model']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'brand', 'model', 'year', 'vehicle_type', 'fuel_type', 'price', 'is_available', 'image', 'description')
        }),
        ('Technical Specifications', {
            'fields': ('top_speed', 'mileage', 'fuel_tank_capacity', 'horsepower', 'engine_capacity', 'fuel_system', 'wheel_size', 'color')
        }),
        ('Safety & Features', {
            'fields': ('abs_status', 'cbs_status', 'brake_type')
        }),
        ('Financing Info', {
            'fields': ('max_loan_percentage',)
        }),
    )

@admin.register(LoanApplication)
class LoanApplicationAdmin(admin.ModelAdmin):
    list_display = ['application_number', 'customer', 'customer_kyc_status', 'vehicle', 'loan_amount', 'interest_rate', 'tenure_months', 'monthly_emi', 'status', 'created_at']
    list_filter = ['status', 'created_at', 'interest_rate']
    search_fields = ['application_number', 'customer__username', 'vehicle__name']
    readonly_fields = ['application_number', 'created_at', 'updated_at', 'customer_link', 'vehicle_link']
    inlines = [EMIScheduleInline]
    
    def customer_kyc_status(self, obj):
        status = obj.customer.kyc_status
        colors = {
            'verified': 'green',
            'rejected': 'red',
            'pending': 'orange',
            'incomplete': 'gray'
        }
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            colors.get(status, 'black'),
            status.capitalize()
        )
    customer_kyc_status.short_description = 'KYC Status'

    def customer_link(self, obj):
        url = reverse("admin:api_user_change", args=[obj.customer.id])
        return format_html('<a href="{}">{}</a>', url, obj.customer.username)
    customer_link.short_description = 'Customer Details'

    def vehicle_link(self, obj):
        url = reverse("admin:api_vehicle_change", args=[obj.vehicle.id])
        return format_html('<a href="{}">{}</a>', url, obj.vehicle.name)
    vehicle_link.short_description = 'Vehicle Details'

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ['application', 'document_type', 'status', 'uploaded_at']
    list_filter = ['document_type', 'status']
    search_fields = ['application__application_number']

@admin.register(EMISchedule)
class EMIScheduleAdmin(admin.ModelAdmin):
    list_display = ['application', 'emi_number', 'due_date', 'emi_amount', 'status']
    list_filter = ['status', 'due_date']
    search_fields = ['application__application_number']

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['transaction_id', 'emi_schedule', 'amount', 'payment_method', 'payment_date']
    list_filter = ['payment_method', 'payment_date']
    search_fields = ['transaction_id']

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'title', 'is_read', 'created_at']
    list_filter = ['is_read', 'created_at']
    search_fields = ['user__username', 'title']

@admin.register(KYCProfile)
class KYCProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'full_name', 'citizenship_number', 'status', 'submitted_at', 'verified_at']
    list_filter = ['status', 'submitted_at', 'verified_at']
    search_fields = ['user__username', 'full_name', 'citizenship_number', 'pan_number']
    readonly_fields = ['created_at', 'updated_at', 'submitted_at', 'verified_at']
    inlines = [KYCDocumentInline]

    fieldsets = (
        ('User Information', {
            'fields': ('user', 'status', 'verified_by', 'verification_notes', 'rejection_reason')
        }),
        ('Personal Information', {
            'fields': ('full_name', 'father_name', 'mother_name', 'grandfather_name', 'date_of_birth', 'gender')
        }),
        ('Address Information', {
            'fields': ('permanent_address', 'permanent_district', 'permanent_province',
                      'temporary_address', 'temporary_district', 'temporary_province')
        }),
        ('Contact Information', {
            'fields': ('phone', 'alternate_phone', 'email')
        }),
        ('Identification', {
            'fields': ('citizenship_number', 'citizenship_issue_date', 'citizenship_issue_district',
                      'pan_number', 'license_number', 'passport_number')
        }),
        ('Occupation', {
            'fields': ('occupation', 'employer_name', 'annual_income')
        }),
        ('Timestamps', {
            'fields': ('submitted_at', 'verified_at', 'created_at', 'updated_at')
        }),
    )

@admin.register(KYCDocument)
class KYCDocumentAdmin(admin.ModelAdmin):
    list_display = ['kyc_profile', 'document_type', 'status', 'uploaded_at', 'verified_at']
    list_filter = ['document_type', 'status', 'uploaded_at']
    search_fields = ['kyc_profile__user__username', 'kyc_profile__full_name']
    readonly_fields = ['uploaded_at', 'verified_at']

@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ['user', 'intent', 'created_at']
    list_filter = ['intent', 'created_at']