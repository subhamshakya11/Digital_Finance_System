from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    register, login, get_profile, update_profile,
    VehicleViewSet, LoanApplicationViewSet, DocumentViewSet,
    EMIScheduleViewSet, PaymentViewSet, NotificationViewSet,
    dashboard_stats, UserViewSet
)
from .kyc_views import KYCProfileViewSet, KYCDocumentViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'vehicles', VehicleViewSet, basename='vehicle')
router.register(r'loans', LoanApplicationViewSet, basename='loan')
router.register(r'documents', DocumentViewSet, basename='document')
router.register(r'emi-schedules', EMIScheduleViewSet, basename='emi-schedule')
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'kyc', KYCProfileViewSet, basename='kyc')
router.register(r'kyc-documents', KYCDocumentViewSet, basename='kyc-document')

urlpatterns = [
    path('auth/register/', register, name='register'),
    path('auth/login/', login, name='login'),
    path('auth/profile/', get_profile, name='profile'),
    path('auth/profile/update/', update_profile, name='update-profile'),
    path('dashboard/stats/', dashboard_stats, name='dashboard-stats'),
    path('', include(router.urls)),
]
