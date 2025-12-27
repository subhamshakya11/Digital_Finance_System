import re
from datetime import datetime, timedelta


class VehicleFinanceChatbot:
    """
    Intelligent chatbot for vehicle finance queries
    Handles FAQ, loan status, EMI calculations, and general queries
    """
    
    def __init__(self):
        self.intents = {
            'greeting': ['hello', 'hi', 'hey', 'namaste', 'good morning', 'good afternoon'],
            'loan_info': ['loan', 'finance', 'borrow', 'credit'],
            'emi_info': ['emi', 'installment', 'monthly payment', 'payment'],
            'documents': ['document', 'paper', 'certificate', 'kyc', 'citizenship'],
            'eligibility': ['eligible', 'qualify', 'criteria', 'requirement'],
            'interest_rate': ['interest', 'rate', 'apr', 'percentage'],
            'application_status': ['status', 'track', 'where is my', 'application'],
            'vehicle_types': ['vehicle', 'car', 'bike', 'types', 'models'],
            'tenure': ['tenure', 'duration', 'period', 'how long'],
            'approval_time': ['approval', 'how long', 'processing time', 'when'],
            'down_payment': ['down payment', 'advance', 'initial payment'],
            'help': ['help', 'support', 'assist'],
            'goodbye': ['bye', 'goodbye', 'see you', 'exit'],
        }
        
        self.responses = self.initialize_responses()
    
    def initialize_responses(self):
        """Initialize response templates"""
        return {
            'greeting': [
                "Hello! 👋 Welcome to Digital Vehicle Finance System. How can I help you today?",
                "Namaste! 🙏 I'm here to assist you with vehicle financing in Nepal. What would you like to know?",
                "Hi there! I can help you with loan applications, EMI calculations, and more. What's your question?"
            ],
            
            'loan_info': """
🚗 **Vehicle Loan Information**

We offer vehicle financing for:
• Two-wheelers (Bikes/Scooters)
• Cars and SUVs
• Commercial vehicles

**Key Features:**
✓ Loan up to 80% of vehicle value
✓ Flexible tenure: 6 months to 10 years
✓ Competitive interest rates
✓ Quick approval process
✓ Minimal documentation

Would you like to know about eligibility criteria or apply for a loan?
            """,
            
            'emi_info': """
💰 **EMI (Equated Monthly Installment) Information**

Your EMI depends on:
1. Loan amount
2. Interest rate
3. Loan tenure

**EMI Formula:**
EMI = [P × R × (1+R)^N] / [(1+R)^N - 1]

Where:
• P = Loan amount
• R = Monthly interest rate
• N = Tenure in months

**Example:**
For NPR 10,00,000 loan at 12% interest for 5 years:
Monthly EMI ≈ NPR 22,244

Would you like me to calculate EMI for your specific case?
            """,
            
            'documents': """
📄 **Required Documents for Vehicle Loan**

**Individual Applicants:**
1. Citizenship certificate (copy)
2. Passport size photos (2)
3. Driving license (copy)
4. PAN card (if applicable)
5. Bank statement (last 6 months)
6. Salary certificate / Income proof
7. Vehicle quotation

**For Business:**
• Company registration certificate
• MOA/AOA
• Tax clearance certificate
• Audited financial statements

**Additional:**
• Property documents (for collateral)
• Guarantor documents (if required)

All documents can be uploaded directly through our platform!
            """,
            
            'eligibility': """
✅ **Loan Eligibility Criteria**

**Age:** 21-65 years
**Income:** Regular source of income
**Employment:** 
• Salaried: Minimum 6 months in current job
• Self-employed: Minimum 2 years in business

**Credit Score:** Good credit history preferred

**Loan Amount:** 
• Minimum: NPR 50,000
• Maximum: Up to 80% of vehicle price

**Down Payment:** Minimum 20% of vehicle price

**Special Benefits:**
🔋 Electric vehicles: Up to 80% financing
🚗 Traditional vehicles: Up to 70% financing

Check your eligibility by applying online!
            """,
            
            'interest_rate': """
📊 **Interest Rates**

Our competitive rates:
• **Private Cars:** 12-14% per annum
• **Two-wheelers:** 13-15% per annum
• **Electric Vehicles:** 10-12% per annum 🔋
• **Commercial Vehicles:** 14-16% per annum

**Factors affecting your rate:**
✓ Credit score
✓ Down payment amount
✓ Loan tenure
✓ Employment type
✓ Vehicle type

**Special Offers:**
🎁 Lower rates for government employees
🎁 Reduced rates for higher down payments
🎁 Green vehicle incentives

*Rates subject to bank approval and current policy*
            """,
            
            'application_status': """
📱 **Track Your Application**

To check your loan application status:

1. Log in to your account
2. Go to "My Applications"
3. View real-time status updates

**Application Stages:**
1️⃣ Submitted - Application received
2️⃣ Under Review - Documents being verified
3️⃣ Documents Verified - Sales team completed check
4️⃣ AI Scoring - Automated credit assessment
5️⃣ Finance Review - Final evaluation
6️⃣ Approved/Rejected - Decision made

You'll receive SMS/Email notifications at each stage!

Would you like me to help with anything else?
            """,
            
            'vehicle_types': """
🚗 **Vehicles We Finance**

**Two-Wheelers:**
• Motorcycles
• Scooters
• Electric bikes

**Cars:**
• Sedans
• Hatchbacks
• SUVs
• Crossovers

**Commercial Vehicles:**
• Vans
• Pickup trucks
• Microbuses
• Delivery vehicles

**Special Categories:**
🔋 Electric vehicles (preferred rates)
🚕 Taxis (commercial financing)
🚌 Tourist vehicles

Browse our vehicle catalog or apply for any vehicle from authorized dealers in Nepal!
            """,
            
            'tenure': """
⏰ **Loan Tenure Options**

**Available Tenures:**
• Minimum: 6 months
• Maximum: 10 years (120 months)

**Recommended Tenure:**
📱 Two-wheelers: 2-3 years
🚗 Cars: 3-5 years
🚚 Commercial vehicles: 5-7 years

**Impact of Tenure:**
✓ **Shorter tenure:**
  - Higher EMI
  - Less total interest
  - Faster ownership

✓ **Longer tenure:**
  - Lower EMI
  - More total interest
  - Extended repayment

**Pro Tip:** Choose a tenure where EMI is 30-40% of your monthly income for comfortable repayment!
            """,
            
            'approval_time': """
⚡ **Loan Approval Timeline**

**Standard Processing:**
1. Application submission: Instant
2. Document verification: 1-2 working days
3. AI credit scoring: Few minutes
4. Finance team review: 1-2 working days
5. Final approval: Same day after review

**Total Time:** 2-5 working days typically

**Fast-Track Processing:**
✓ Complete documentation
✓ Good credit score
✓ Higher down payment
→ Approval in 24-48 hours! ⚡

**After Approval:**
• EMI schedule generated immediately
• Loan disbursement: 1-2 days
• Vehicle delivery: As per dealer

Track your application status anytime through your dashboard!
            """,
            
            'down_payment': """
💵 **Down Payment Information**

**Minimum Requirements:**
• Standard vehicles: 20% of vehicle price
• Electric vehicles: 20% of vehicle price
• Luxury vehicles: 30-40% of vehicle price

**Benefits of Higher Down Payment:**
✅ Lower loan amount
✅ Reduced EMI
✅ Better interest rates
✅ Faster approval
✅ Less interest over time

**Example:**
Vehicle Price: NPR 20,00,000

Option 1 (20% down):
• Down payment: NPR 4,00,000
• Loan amount: NPR 16,00,000

Option 2 (30% down):
• Down payment: NPR 6,00,000
• Loan amount: NPR 14,00,000
• Saves ~NPR 50,000 in interest!

**Payment Methods:**
💳 Bank transfer
💰 Cash at dealer
📱 Digital wallets (eSewa, Khalti)
            """,
            
            'help': """
🆘 **How Can I Help You?**

I can assist with:

1️⃣ **Loan Information**
   - Eligibility criteria
   - Interest rates
   - Loan amounts

2️⃣ **EMI Calculations**
   - Calculate monthly payments
   - Compare tenure options

3️⃣ **Application Process**
   - Required documents
   - Application status
   - Step-by-step guidance

4️⃣ **Vehicle Information**
   - Types we finance
   - Browse vehicles

5️⃣ **FAQs**
   - Common questions
   - General queries

Just ask me anything! For example:
• "What documents do I need?"
• "Calculate EMI for 10 lakh loan"
• "What's the interest rate?"
• "How to check my application status?"
            """,
            
            'goodbye': [
                "Thank you for using Digital Vehicle Finance System! 🚗 Have a great day!",
                "Goodbye! Feel free to return anytime you need assistance. Drive safe! 🙏",
                "Thank you! If you need any help in the future, I'm here. Take care! 👋"
            ],
            
            'default': """
I'm not sure I understand that question. 🤔

I can help you with:
• Loan information and eligibility
• EMI calculations
• Required documents
• Application status
• Vehicle types and financing
• Interest rates

Try asking something like:
• "What are the loan requirements?"
• "Calculate my EMI"
• "What documents do I need?"
• "Show me vehicle types"

Or type "help" to see all available options!
            """
        }
    
    def get_intent(self, message):
        """Identify user intent from message"""
        message = message.lower().strip()
        
        # Check each intent
        for intent, keywords in self.intents.items():
            for keyword in keywords:
                if keyword in message:
                    return intent
        
        # Special handling for EMI calculations
        if 'calculate' in message or 'emi' in message:
            return 'emi_calculation'
        
        return 'default'
    
    def calculate_emi(self, principal, rate, tenure):
        """Calculate EMI amount"""
        try:
            P = float(principal)
            R = float(rate) / (12 * 100)
            N = int(tenure)
            
            if R == 0:
                emi = P / N
            else:
                emi = P * R * (1 + R)**N / ((1 + R)**N - 1)
            
            total_payment = emi * N
            total_interest = total_payment - P
            
            return {
                'emi': round(emi, 2),
                'total_payment': round(total_payment, 2),
                'total_interest': round(total_interest, 2),
                'principal': P,
                'rate': rate,
                'tenure': N
            }
        except:
            return None
    
    def extract_numbers(self, message):
        """Extract numbers from message for EMI calculation"""
        numbers = re.findall(r'\d+(?:\.\d+)?', message)
        return [float(n) for n in numbers]
    
    def handle_emi_calculation(self, message):
        """Handle EMI calculation request"""
        numbers = self.extract_numbers(message)
        
        if len(numbers) >= 2:
            # Assume: amount, tenure (in months or years)
            amount = numbers[0]
            if amount < 1000:  # Probably in lakhs
                amount *= 100000
            
            tenure = int(numbers[1])
            if tenure <= 15:  # Probably years
                tenure *= 12
            
            rate = 12.0  # Default rate
            if len(numbers) >= 3:
                rate = numbers[2]
            
            result = self.calculate_emi(amount, rate, tenure)
            
            if result:
                return f"""
💰 **EMI Calculation Result**

**Loan Details:**
• Principal Amount: NPR {result['principal']:,.2f}
• Interest Rate: {result['rate']}% per annum
• Tenure: {result['tenure']} months ({result['tenure']//12} years)

**EMI Breakdown:**
📊 Monthly EMI: **NPR {result['emi']:,.2f}**

💵 Total Amount Payable: NPR {result['total_payment']:,.2f}
💸 Total Interest: NPR {result['total_interest']:,.2f}

**Monthly Breakdown (approx):**
• Principal: NPR {result['principal']/result['tenure']:,.2f}
• Interest: NPR {result['total_interest']/result['tenure']:,.2f}

Would you like to apply for this loan? Type "apply" or visit our loan application page!
                """
        
        return """
To calculate EMI, please provide:
1. Loan amount (in NPR)
2. Loan tenure (in months or years)
3. Interest rate (optional, default is 12%)

**Example:**
"Calculate EMI for 1000000 loan for 5 years"
or
"Calculate EMI for 10 lakh 60 months 12% interest"
        """
    
    def get_response(self, message, user=None):
        """Generate response based on user message"""
        intent = self.get_intent(message)
        
        if intent == 'emi_calculation':
            return self.handle_emi_calculation(message)
        
        response = self.responses.get(intent, self.responses['default'])
        
        # If response is a list, return random choice
        if isinstance(response, list):
            import random
            return random.choice(response)
        
        return response
