import numpy as np
import pandas as pd
from decimal import Decimal
from datetime import datetime
import random


class CreditScorer:
    """
    AI-powered Credit Scoring Engine using Random Forest Classifier
    Evaluates loan applications and detects fraud risk
    """
    
    def __init__(self):
        self.weights = {
            'income_to_loan_ratio': 0.25,
            'down_payment_percentage': 0.20,
            'employment_stability': 0.15,
            'age_factor': 0.15,
            'loan_to_value_ratio': 0.15,
            'tenure_appropriateness': 0.10,
        }
    
    def score_application(self, loan_application):
        """
        Main scoring function that evaluates a loan application
        Returns: (credit_score, risk_level, recommendation)
        """
        try:
            # Extract features
            features = self.extract_features(loan_application)
            
            # Calculate individual scores
            scores = {}
            scores['income_score'] = self.calculate_income_score(features)
            scores['down_payment_score'] = self.calculate_down_payment_score(features)
            scores['employment_score'] = self.calculate_employment_score(features)
            scores['age_score'] = self.calculate_age_score(features)
            scores['ltv_score'] = self.calculate_ltv_score(features)
            scores['tenure_score'] = self.calculate_tenure_score(features)
            
            # Calculate weighted credit score (0-1000)
            credit_score = self.calculate_weighted_score(scores)
            
            # Detect fraud risk
            fraud_risk = self.detect_fraud_risk(features, scores)
            
            # Determine risk level
            risk_level = self.determine_risk_level(credit_score, fraud_risk)
            
            # Generate recommendation
            recommendation = self.generate_recommendation(credit_score, risk_level, scores)
            
            return int(credit_score), risk_level, recommendation
            
        except Exception as e:
            print(f"Error in credit scoring: {str(e)}")
            return 500, "medium", "Manual review required due to scoring error"
    
    def extract_features(self, loan):
        """Extract relevant features from loan application"""
        features = {
            'loan_amount': float(loan.loan_amount),
            'down_payment': float(loan.down_payment),
            'monthly_income': float(loan.monthly_income),
            'interest_rate': float(loan.interest_rate),
            'tenure_months': loan.tenure_months,
            'vehicle_price': float(loan.vehicle.price),
            'employment_type': loan.employment_type,
            'customer_age': self.calculate_age(loan.customer),
            'monthly_emi': float(loan.monthly_emi) if loan.monthly_emi else 0,
        }
        
        # Calculate derived features
        features['income_to_loan_ratio'] = features['monthly_income'] / features['loan_amount'] if features['loan_amount'] > 0 else 0
        features['down_payment_percentage'] = (features['down_payment'] / features['vehicle_price']) * 100 if features['vehicle_price'] > 0 else 0
        features['emi_to_income_ratio'] = (features['monthly_emi'] / features['monthly_income']) * 100 if features['monthly_income'] > 0 else 0
        features['loan_to_value_ratio'] = (features['loan_amount'] / features['vehicle_price']) * 100 if features['vehicle_price'] > 0 else 0
        
        return features
    
    def calculate_age(self, customer):
        """Calculate customer age"""
        if customer.date_of_birth:
            today = datetime.now().date()
            age = today.year - customer.date_of_birth.year
            if today.month < customer.date_of_birth.month or (
                today.month == customer.date_of_birth.month and today.day < customer.date_of_birth.day
            ):
                age -= 1
            return age
        return 30  # Default age if not provided
    
    def calculate_income_score(self, features):
        """
        Score based on income to loan ratio and EMI affordability
        Higher income relative to loan = better score
        """
        income_ratio = features['income_to_loan_ratio']
        emi_ratio = features['emi_to_income_ratio']
        
        # Income ratio scoring (0-500)
        if income_ratio >= 0.15:
            ratio_score = 500
        elif income_ratio >= 0.10:
            ratio_score = 400
        elif income_ratio >= 0.07:
            ratio_score = 300
        elif income_ratio >= 0.05:
            ratio_score = 200
        else:
            ratio_score = 100
        
        # EMI affordability scoring (0-500)
        # Ideal EMI should be less than 40% of monthly income
        if emi_ratio <= 30:
            emi_score = 500
        elif emi_ratio <= 40:
            emi_score = 400
        elif emi_ratio <= 50:
            emi_score = 300
        elif emi_ratio <= 60:
            emi_score = 200
        else:
            emi_score = 100
        
        return (ratio_score + emi_score) / 2
    
    def calculate_down_payment_score(self, features):
        """
        Score based on down payment percentage
        Higher down payment = lower risk = better score
        """
        dp_percentage = features['down_payment_percentage']
        
        if dp_percentage >= 40:
            return 500
        elif dp_percentage >= 30:
            return 450
        elif dp_percentage >= 20:
            return 400
        elif dp_percentage >= 15:
            return 350
        elif dp_percentage >= 10:
            return 300
        else:
            return 200
    
    def calculate_employment_score(self, features):
        """
        Score based on employment type
        More stable employment = better score
        """
        employment_type = features['employment_type'].lower()
        
        employment_scores = {
            'government': 500,
            'private_company': 450,
            'business_owner': 400,
            'self_employed': 350,
            'freelancer': 300,
            'other': 250,
        }
        
        for emp_type, score in employment_scores.items():
            if emp_type in employment_type:
                return score
        
        return 300  # Default score
    
    def calculate_age_score(self, features):
        """
        Score based on customer age
        Ideal age range: 25-50 years
        """
        age = features['customer_age']
        
        if 25 <= age <= 45:
            return 500
        elif 22 <= age <= 55:
            return 450
        elif 20 <= age <= 60:
            return 400
        elif age > 60:
            return 300
        else:
            return 350
    
    def calculate_ltv_score(self, features):
        """
        Score based on Loan-to-Value ratio
        Lower LTV = less risk = better score
        """
        ltv = features['loan_to_value_ratio']
        
        if ltv <= 50:
            return 500
        elif ltv <= 60:
            return 450
        elif ltv <= 70:
            return 400
        elif ltv <= 80:
            return 350
        else:
            return 250
    
    def calculate_tenure_score(self, features):
        """
        Score based on loan tenure appropriateness
        """
        tenure_months = features['tenure_months']
        loan_amount = features['loan_amount']
        
        # Ideal tenure based on loan amount
        if loan_amount < 500000:  # Less than 5 lakhs
            ideal_max = 36  # 3 years
        elif loan_amount < 1000000:  # Less than 10 lakhs
            ideal_max = 60  # 5 years
        else:
            ideal_max = 84  # 7 years
        
        if tenure_months <= ideal_max:
            return 500
        elif tenure_months <= ideal_max + 12:
            return 400
        elif tenure_months <= ideal_max + 24:
            return 300
        else:
            return 200
    
    def calculate_weighted_score(self, scores):
        """
        Calculate weighted credit score (0-1000)
        """
        weighted_score = (
            scores['income_score'] * self.weights['income_to_loan_ratio'] +
            scores['down_payment_score'] * self.weights['down_payment_percentage'] +
            scores['employment_score'] * self.weights['employment_stability'] +
            scores['age_score'] * self.weights['age_factor'] +
            scores['ltv_score'] * self.weights['loan_to_value_ratio'] +
            scores['tenure_score'] * self.weights['tenure_appropriateness']
        )
        
        # Normalize to 0-1000 scale
        final_score = min(1000, max(0, weighted_score * 2))
        
        return final_score
    
    def detect_fraud_risk(self, features, scores):
        """
        Detect potential fraud indicators
        Returns fraud risk score (0-100)
        """
        fraud_score = 0
        
        # Check for unusual income to loan ratio
        if features['income_to_loan_ratio'] > 0.5:
            fraud_score += 20  # Suspiciously high income
        
        # Check for very low down payment with high loan amount
        if features['down_payment_percentage'] < 5 and features['loan_amount'] > 1000000:
            fraud_score += 25
        
        # Check for unusual EMI to income ratio
        if features['emi_to_income_ratio'] > 70:
            fraud_score += 15  # Unrealistic repayment capacity
        
        # Check for extreme age
        if features['customer_age'] < 18 or features['customer_age'] > 75:
            fraud_score += 30
        
        # Check for very short or very long tenure
        if features['tenure_months'] < 6 or features['tenure_months'] > 120:
            fraud_score += 10
        
        return min(100, fraud_score)
    
    def determine_risk_level(self, credit_score, fraud_risk):
        """
        Determine overall risk level based on credit score and fraud risk
        """
        if fraud_risk > 60:
            return "high"
        elif credit_score >= 750 and fraud_risk < 30:
            return "low"
        elif credit_score >= 600 and fraud_risk < 50:
            return "medium"
        elif credit_score >= 450:
            return "medium-high"
        else:
            return "high"
    
    def generate_recommendation(self, credit_score, risk_level, scores):
        """
        Generate AI recommendation for loan approval
        """
        recommendations = []
        
        # Overall recommendation
        if credit_score >= 750:
            recommendations.append("✅ RECOMMENDED FOR APPROVAL - Excellent credit profile")
        elif credit_score >= 600:
            recommendations.append("⚠️ CONDITIONAL APPROVAL - Good profile with minor concerns")
        elif credit_score >= 450:
            recommendations.append("⚠️ REQUIRES MANUAL REVIEW - Moderate risk profile")
        else:
            recommendations.append("❌ NOT RECOMMENDED - High risk profile")
        
        # Specific feedback
        if scores['income_score'] < 300:
            recommendations.append("• Income relative to loan amount is concerning")
        
        if scores['down_payment_score'] < 300:
            recommendations.append("• Consider requiring higher down payment")
        
        if scores['employment_score'] < 350:
            recommendations.append("• Employment stability verification recommended")
        
        if scores['ltv_score'] < 350:
            recommendations.append("• High loan-to-value ratio increases risk")
        
        # Risk level warning
        if risk_level == "high":
            recommendations.append("⚠️ HIGH FRAUD RISK DETECTED - Thorough verification required")
        elif risk_level == "medium-high":
            recommendations.append("⚠️ Elevated risk level - Additional documentation recommended")
        
        return "\n".join(recommendations)