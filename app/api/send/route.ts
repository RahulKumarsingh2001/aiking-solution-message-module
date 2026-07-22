import { NextResponse } from 'next/server';
import { getTwilioClient, getFromNumber } from '@/lib/twilioClient';

type Recipient = {
  name: string;
  phone: string;
  amount?: string;
  due_date?: string;
  account_number?: string;
};

const templateMessages: Record<string, string> = {
  EMI_REMINDER: 'Dear {{name}},\n\nYour EMI of ₹{{amount}} is due on {{due_date}}.\n\nPlease pay before the due date.\n\nABC Bank',
  PAYMENT_CONFIRMATION: 'Dear {{name}},\n\nYour payment of ₹{{amount}} has been successfully received.\n\nTransaction ID: {{transaction_id}}\n\nThank you,\nABC Bank',
  KYC_REMINDER: 'Dear {{name}},\n\nYour KYC is pending. Please complete it to avoid service interruption.\n\nABC Bank',
  CUSTOM: 'Hello {{name}},\n\nThis is a custom campaign message.\n\nABC Bank',
};

function renderMessage(intent: string, r: Recipient) {
  const tpl = templateMessages[intent] || templateMessages.CUSTOM;
  return tpl
    .replace(/\{\{name\}\}/g, r.name || 'Customer')
    .replace(/\{\{amount\}\}/g, r.amount || '')
    .replace(/\{\{due_date\}\}/g, r.due_date || '')
    .replace(/\{\{account_number\}\}/g, r.account_number || '')
    .replace(/\{\{transaction_id\}\}/g, (r as any).transaction_id || '');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Expecting full campaign object from frontend
    const campaign = body.campaign;
    if (!campaign) {
      return NextResponse.json({ success: false, message: 'Missing campaign payload' }, { status: 400 });
    }

    const channel: 'sms' | 'whatsapp' = campaign.channel || 'sms';
    const intent: string = campaign.intent || 'EMI_REMINDER';
    const recipients: Recipient[] = campaign.recipients || campaign.data || [];

    // Verify Twilio configuration before initializing client
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!accountSid || !authToken) {
      return NextResponse.json({ success: false, message: 'Twilio credentials not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN' }, { status: 500 });
    }

    const from = getFromNumber(channel);
    if (!from || String(from).trim().length === 0) {
      return NextResponse.json({ success: false, message: 'Twilio "from" number not configured. Set TWILIO_SMS_FROM or TWILIO_WHATSAPP_FROM' }, { status: 500 });
    }

    // Initialize Twilio client
    const client = getTwilioClient();

    const logs: any[] = [];
    let delivered = 0;
    let failed = 0;

    // Batch sending (100 per batch)
    const batchSize = 100;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);

      await Promise.all(batch.map(async (r) => {
        const toNumber = r.phone && r.phone.length === 10 ? `+91${r.phone}` : (r.phone || '');
        const bodyText = renderMessage(intent, r);

        let attempts = 0;
        let success = false;
        let lastError: any = null;

        while (attempts < 3 && !success) {
          attempts += 1;
          try {
            await client.messages.create({
              body: bodyText,
              from: from,
              to: channel === 'whatsapp' ? `whatsapp:${toNumber}` : toNumber,
            });
            success = true;
            delivered += 1;
            logs.push({ phone: r.phone, status: 'sent', attempts });
          } catch (err) {
            lastError = err;
            // small backoff
            await new Promise((res) => setTimeout(res, 500 * attempts));
          }
        }

        if (!success) {
          failed += 1;
          logs.push({ phone: r.phone, status: 'failed', attempts, error: String(lastError) });
        }
      }));
    }

    return NextResponse.json({ success: true, delivered, failed, total: recipients.length, logs });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Failed to send campaign' }, { status: 500 });
  }
}
