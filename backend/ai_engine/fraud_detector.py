from django.utils import timezone
from datetime import timedelta
import os

class FraudDetector:
    """
    Advanced fraud detection system
    Uses rule-based approach and pattern matching
    """
    
    def __init__(self):
        self.fraud_indicators = []
    
    def check_document_authenticity(self, documents):
        """
        Check uploaded documents for potential fraud
        """
        fraud_flags = []
        
        for doc in documents:
            # Check file size (too small might be fake)
            try:
                if doc.file.size < 5000:  # Less than 5KB (relaxed from 10KB)
                    fraud_flags.append(f"Document {doc.get_document_type_display()} file size is suspiciously small")
            except Exception:
                pass # S3 or other storage might error
            
            # Check file extension
            allowed_extensions = ['.pdf', '.jpg', '.jpeg', '.png']
            _, file_ext = os.path.splitext(doc.file.name.lower())
            if file_ext not in allowed_extensions:
                fraud_flags.append(f"Document {doc.get_document_type_display()} has unusual file format ({file_ext})")
        
        return fraud_flags
    
    def check_application_patterns(self, customer):
        """
        Check for suspicious application patterns
        """
        from api.models import LoanApplication
        
        fraud_flags = []
        
        # Check for multiple recent applications
        recent_apps = LoanApplication.objects.filter(
            customer=customer,
            created_at__gte=timezone.now() - timedelta(days=30)
        ).count()
        
        if recent_apps > 3:
            fraud_flags.append(f"High velocity: {recent_apps} loan applications in last 30 days")
        
        # Check for rejected applications
        rejected_apps = LoanApplication.objects.filter(
            customer=customer,
            status='rejected'
        ).count()
        
        if rejected_apps >= 2:
            fraud_flags.append("Multiple rejected applications in history")
        
        return fraud_flags
    
    def comprehensive_fraud_check(self, loan_application):
        """
        Perform comprehensive fraud check
        """
        all_flags = []
        
        # Document check
        doc_flags = self.check_document_authenticity(loan_application.documents.all())
        all_flags.extend(doc_flags)
        
        # Pattern check
        pattern_flags = self.check_application_patterns(loan_application.customer)
        all_flags.extend(pattern_flags)
        
        # Calculate fraud probability
        fraud_probability = min(100, len(all_flags) * 25)
        
        return {
            'fraud_flags': all_flags,
            'fraud_probability': fraud_probability,
            'is_suspicious': fraud_probability > 50
        }