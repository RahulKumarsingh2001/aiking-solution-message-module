import * as plivo from 'plivo';

type Channel = 'sms' | 'whatsapp';

type SendPlivoMessageOptions = {
  channel: Channel;
  from: string;
  to: string;
  body: string;
};

export function normalizePhoneToE164(phone: string) {
  const digits = String(phone || '').replace(/\D/g, '');

  if (!digits) {
    return '';
  }

  if (digits.length === 10) {
    return `+91${digits}`;
  }

  if (digits.length > 10) {
    return `+${digits.slice(-12)}`;
  }

  return `+${digits}`;
}

export function getPlivoClient() {
  try {
    const authId = process.env.PLIVO_AUTH_ID || '';
    const authToken = process.env.PLIVO_AUTH_TOKEN || '';

    if (!authId || !authToken) {
      throw new Error('Plivo credentials not configured. Set PLIVO_AUTH_ID and PLIVO_AUTH_TOKEN');
    }

    const PlivoClient = (plivo as any).Client;
    return new PlivoClient(authId, authToken);
  } catch (error) {
    console.error('Error initializing Plivo client:', error);
    throw error;
  }
}

export function getPlivoFromNumber(channel: Channel) {
  if (channel === 'whatsapp') {
    return process.env.PLIVO_WHATSAPP_FROM || '';
  }

  return process.env.PLIVO_SMS_FROM || '';
}

export async function sendPlivoMessage({ channel, from, to, body }: SendPlivoMessageOptions) {
  const client = getPlivoClient();
  const payload: Record<string, string | string[]> = {
    src: from,
    dst: to,
    text: body,
  };

  if (channel === 'whatsapp') {
    payload.type = 'whatsapp';
  } else {
    payload.type = 'sms';
  }

  if (process.env.PLIVO_STATUS_URL) {
    payload.url = process.env.PLIVO_STATUS_URL;
  }

  return client.messages.create(payload);
}
