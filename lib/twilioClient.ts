import twilio from 'twilio';

export function getTwilioClient() {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    const authToken = process.env.TWILIO_AUTH_TOKEN || '';
    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN');
    }
  return twilio(accountSid, authToken);
  } catch (error) {
    console.error('Error initializing Twilio client:', error);
    throw error;
  }
}

export function getFromNumber(channel: 'sms' | 'whatsapp') {
  if (channel === 'whatsapp') {
    return `whatsapp:${process.env.TWILIO_WHATSAPP_FROM || ''}`;
  }
  return process.env.TWILIO_SMS_FROM || '';
}
