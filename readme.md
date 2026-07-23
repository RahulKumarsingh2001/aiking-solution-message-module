# Product Requirement Document (PRD)
## Module: SMS & WhatsApp Campaign Automation
## Tech Stack: Next.js (App Router) + TypeScript + Node.js + Twilio API

---

## 1. Objective

Build a campaign automation module for a banking application where admin users can:
- Upload customer data via CSV
- Select communication channel (SMS / WhatsApp)
- Select predefined intent (message template)
- Send or schedule bulk communication campaigns

---

## 2. Key Features

### 2.1 Campaign Creation Flow

1. Upload CSV
2. Validate CSV Data
3. Select Communication Channel (SMS / WhatsApp)
4. Select Intent (Template)
5. Preview Message
6. Send Now / Schedule
7. Start Campaign

---

### 2.2 Supported Intents (Templates)

- EMI Reminder
- Payment Confirmation
- KYC Reminder
- Loan Approval
- Loan Rejection
- Document Pending
- Welcome Message
- Festival Greeting
- Account Statement
- Debit Alert
- Credit Alert
- Card Delivery
- OTP
- Collection Reminder
- Custom Template

---

### 2.3 Dynamic Variables

Templates support dynamic placeholders:
- {{name}}
- {{amount}}
- {{due_date}}
- {{account_number}}
- {{transaction_id}}

---

## 3. User Flow

Dashboard → Campaigns → Create Campaign

Step 1: Upload CSV  
Step 2: Validate Data  
Step 3: Select Channel  
Step 4: Select Intent  
Step 5: Preview  
Step 6: Send / Schedule  

---

## 4. Functional Requirements

### 4.1 CSV Upload
- Accept .csv file 
- Max size: 15MB
- Required fields:
  - name
  - phone
- Optional fields:
  - amount
  - due_date
  - account_number

---

### 4.2 Data Validation
- Validate phone numbers (10 digits)
- Remove duplicates
- Check empty required fields
- Show error report

---

### 4.3 Channel Selection
- SMS → Twilio SMS API
- WhatsApp → Twilio WhatsApp API

- Now we don't used Twilio we can shift to a Plivo module

---

### 4.4 Template Engine
- Replace variables from CSV
- Example:
  "Dear {{name}}" → "Dear Rahul"

---

### 4.5 Campaign Execution
- Batch sending (100 per batch)
- Retry failed messages (max 3 retries)
- Queue system

---

### 4.6 Campaign Tracking
- Status:
  - Pending
  - Sent
  - Failed
- Store logs

---

### 4.7 Analytics
- Total messages
- Delivered
- Failed
- Success rate

---

## 5. Non-Functional Requirements

- Scalable (handle 10k+ users)
- Secure (no data leaks)
- Fast processing
- Error handling
- Logging

---

## 6. Tech Stack

Frontend:
- Next.js (App Router)
- TypeScript
- Tailwind CSS

Backend:
- Next.js API Routes
- Node.js

Database:
- MongoDB

Messaging:
- Twilio API

Queue:
- BullMQ / Redis (optional)

---

## 7. API Design

### Upload CSV
POST /api/upload




---

Body: FormData(file)


### Create Campaign
POST /api/campaign

{
"channel": "sms",
"intent": "EMI_REMINDER",
"data": [...]
}


### Send Campaign
POST /api/send

{
"campaignId": "123"
}


---

## 8. Database Schema

### Campaign

{
id: string,
name: string,
channel: "sms" | "whatsapp",
intent: string,
status: "pending" | "sent" | "failed",
createdAt: Date
}


### Message Log

{
id: string,
campaignId: string,
phone: string,
message: string,
status: string,
error: string
}


---

## 9. Twilio Integration

Install:

npm install twilio


Example:

import twilio from "twilio";

const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

await client.messages.create({
body: "Hello",
from: "+1234567890",
to: "+91XXXXXXXXXX",
});


---

## 10. Future Enhancements

- Email support
- AI-based message personalization
- Campaign scheduling UI
- Delivery webhook tracking

---

## 📊 ✅ DEMO CSV DATA (COPY-PASTE)

name,phone,amount,due_date,account_number
Rahul Singh,9876543210,5000,2026-07-30,ACC12345
Amit Kumar,9123456780,7500,2026-08-01,ACC23456
Neha Sharma,9988776655,3000,2026-07-28,ACC34567
Priya Verma,9871234560,6500,2026-07-25,ACC45678
Rohit Das,9012345678,4500,2026-07-29,ACC56789
Anjali Mehta,9090909090,5500,2026-07-31,ACC67890
Vikas Yadav,8888888888,8000,2026-08-02,ACC78901
Pooja Singh,7777777777,2000,2026-07-27,ACC89012
Karan Patel,9666666666,9000,2026-08-05,ACC90123
Sneha Gupta,9555555555,4000,2026-07-26,ACC01234

---

## TEMPLATE EXAMPLES (COPY-PASTE)

### EMI Reminder
Dear {{name}},

Your EMI of ₹{{amount}} is due on {{due_date}}.

Please pay before the due date.

ABC Bank

### Payment Confirmation
Dear {{name}},

Your payment of ₹{{amount}} has been successfully received.

Transaction ID: {{transaction_id}}

Thank you,
ABC Bank

### KYC Reminder
Dear {{name}},

Your KYC is pending. Please complete it to avoid service interruption.

ABC Bank