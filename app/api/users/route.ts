import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getUsers, createUser } from '@/lib/storage';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const users = await getUsers();

    // Don't send passwords to client
    const safeUsers = users.map(({ username, isAdmin }) => ({
      username,
      isAdmin,
    }));

    return NextResponse.json(safeUsers);
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

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const newUser = await createUser({
      username,
      password,
      isAdmin: false,
    });

    return NextResponse.json(
      {
        username: newUser.username,
        isAdmin: newUser.isAdmin,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message === 'User already exists') {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

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
