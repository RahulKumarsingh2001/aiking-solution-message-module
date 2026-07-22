import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const campaign = {
      id: `camp-${Date.now()}`,
      name: body.intent || 'campaign',
      channel: body.channel || 'sms',
      intent: body.intent || 'EMI_REMINDER',
      status: 'pending',
      createdAt: new Date().toISOString(),
      recipients: body.data || [],
    };

    return NextResponse.json({
      success: true,
      campaignId: campaign.id,
      message: 'Campaign created successfully',
      campaign,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to create campaign' }, { status: 500 });
  }
}
