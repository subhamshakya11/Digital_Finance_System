from django.contrib import admin
from .models import User, Vehicle, LoanApplication, Document, EMISchedule, Payment, Notification, ChatMessage

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'email', 'user_type', 'created_at']
    list_filter = ['user_type', 'created_at']
    search_fields = ['username', 'email', 'first_name', 'last_name']

@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ['name', 'brand', 'model', 'year', 'vehicle_type', 'price', 'is_available']
    list_filter = ['vehicle_type', 'fuel_type', 'is_available']
    search_fields = ['name', 'brand', 'model']

@admin.register(LoanApplication)
class LoanApplicationAdmin(admin.ModelAdmin):
    list_display = ['application_number', 'customer', 'vehicle', 'loan_amount', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['application_number', 'customer__username']

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ['application', 'document_type', 'status', 'uploaded_at']
    list_filter = ['document_type', 'status']

@admin.register(EMISchedule)
class EMIScheduleAdmin(admin.ModelAdmin):
    list_display = ['application', 'emi_number', 'due_date', 'emi_amount', 'status']
    list_filter = ['status', 'due_date']

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['emi_schedule', 'amount', 'payment_method', 'payment_date']
    list_filter = ['payment_method', 'payment_date']

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'title', 'is_read', 'created_at']
    list_filter = ['is_read', 'created_at']

@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ['user', 'intent', 'created_at']
    list_filter = ['intent', 'created_at']