import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireAdmin } from '@/lib/auth';
import { getButtons, createButton } from '@/lib/storage';
import { Button } from '@/types';

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const buttons = await getButtons();
    return NextResponse.json(buttons);
  } catch (error) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { label, webhook, color, order } = body;

    if (!label || !webhook || !color) {
      return NextResponse.json(
        { error: 'Label, webhook, and color are required' },
        { status: 400 }
      );
    }

    const newButton = await createButton({
      label,
      webhook,
      color,
      order: order ?? Date.now(),
    });

    return NextResponse.json(newButton, { status: 201 });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
