from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'vehicles', views.VehicleViewSet, basename='vehicle')
router.register(r'loans', views.LoanApplicationViewSet, basename='loan')
router.register(r'documents', views.DocumentViewSet, basename='document')
router.register(r'emi-schedules', views.EMIScheduleViewSet, basename='emi-schedule')
router.register(r'payments', views.PaymentViewSet, basename='payment')
router.register(r'users', views.UserViewSet, basename='user')
router.register(r'notifications', views.NotificationViewSet, basename='notification')

urlpatterns = [
    # Authentication
    path('auth/register/', views.register, name='register'),
    path('auth/login/', views.login, name='login'),
    path('auth/profile/', views.get_profile, name='profile'),
    path('auth/profile/update/', views.update_profile, name='update-profile'),
    
    # Dashboard
    path('dashboard/stats/', views.dashboard_stats, name='dashboard-stats'),
    
    # Router URLs
    path('', include(router.urls)),
]
