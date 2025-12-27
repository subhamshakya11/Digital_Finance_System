from django.core.management.base import BaseCommand
from api.models import User, Vehicle, LoanApplication, Document
from ai_engine.fraud_detector import FraudDetector
from django.utils import timezone
import os

class Command(BaseCommand):
    help = 'Test the Fraud Detection System'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS('Testing Fraud Detection System...'))

        # 1. Setup Test Data
        try:
             # Create/Get User
            user, _ = User.objects.get_or_create(
                username='fraud_test_user',
                email='fraud@test.com',
                defaults={
                    'first_name': 'Test', 
                    'last_name': 'Fraud',
                    'phone': '9800000000',
                    'user_type': 'customer'
                }
            )
            
            # Get Vehicle
            vehicle = Vehicle.objects.first()
            if not vehicle:
                self.stdout.write(self.style.ERROR('No vehicles found. Please seed vehicles first.'))
                return

            # Create Loan Application
            price = float(vehicle.price)
            loan = LoanApplication.objects.create(
                customer=user,
                vehicle=vehicle,
                loan_amount=price * 0.8,
                down_payment=price * 0.2,
                interest_rate=12,
                tenure_months=36,
                monthly_income=50000,
                employment_type='salaried',
                status='draft'
            )
            self.stdout.write(f'Created Test Loan: {loan.application_number}')
            
            # 2. Simulate Fraud Conditions
            
            # Condition A: Small File (Mocking a document)
            # We can't easily mock file uploads here without a file on disk, 
            # so we'll skip document check or create a tiny dummy file if needed.
            # But let's focus on Velocity (Pattern) check.
            
            # Condition B: High Velocity (Create 4 more loans)
            self.stdout.write('Simulating high velocity (multiple apps)...')
            for i in range(4):
                LoanApplication.objects.create(
                    customer=user,
                    vehicle=vehicle,
                    loan_amount=price * 0.8,
                    down_payment=price * 0.2,
                    interest_rate=12,
                    tenure_months=36,
                    monthly_income=50000,
                    employment_type='salaried',
                    status='draft'
                )
            
            # 3. Run Fraud Detector
            detector = FraudDetector()
            result = detector.comprehensive_fraud_check(loan)
            
            # 4. Output Results
            self.stdout.write('\n--- FRAUD DETECTION RESULTS ---')
            self.stdout.write(f"Is Suspicious: {result['is_suspicious']}")
            self.stdout.write(f"Fraud Probability: {result['fraud_probability']}%")
            self.stdout.write("Flags Found:")
            for flag in result['fraud_flags']:
                 self.stdout.write(f" - {flag}")
            
            if result['is_suspicious']:
                self.stdout.write(self.style.SUCCESS('\nSUCCESS: Fraud System correctly identified suspicious activity!'))
            else:
                self.stdout.write(self.style.WARNING('\nWARNING: System did not flag as suspicious (might need stricter rules or more test data).'))
                
            # Cleanup
            self.stdout.write('\nCleaning up test data...')
            LoanApplication.objects.filter(customer=user).delete()
            # user.delete() # Keep user for manual testing if needed
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Test Failed: {str(e)}'))
