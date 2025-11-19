import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getButton } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { buttonId } = await request.json();

    if (!buttonId) {
      return NextResponse.json(
        { error: 'Button ID required' },
        { status: 400 }
      );
    }

    const button = await getButton(buttonId);

    if (!button) {
      return NextResponse.json(
        { error: 'Button not found' },
        { status: 404 }
      );
    }

    // Send POST request to webhook
    try {
      const webhookResponse = await fetch(button.webhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          buttonId: button.id,
          buttonLabel: button.label,
          triggeredBy: session.username,
          timestamp: new Date().toISOString(),
        }),
      });

      // Try to parse JSON response from webhook
      let webhookData: any = null;
      try {
        const contentType = webhookResponse.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          webhookData = await webhookResponse.json();
        }
      } catch (e) {
        // If parsing fails, continue without webhook data
      }

      return NextResponse.json({
        success: true,
        status: webhookResponse.status,
        statusText: webhookResponse.statusText,
        message: webhookData?.message || null,
        data: webhookData,
      });
    } catch (webhookError: any) {
      console.error('Webhook error:', webhookError);
      return NextResponse.json(
        {
          success: false,
          error: 'Error al ejecutar webhook: ' + webhookError.message,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
