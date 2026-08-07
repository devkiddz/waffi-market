import { NextResponse } from 'next/server';

import {
  isAuthEmailEnabled,
  sendTransactionalEmail
} from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { message: 'Not found.' },
      { status: 404 }
    );
  }

  if (!isAuthEmailEnabled()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'Authentication email is disabled or missing configuration.'
      },
      { status: 503 }
    );
  }

  const recipient = process.env.AUTH_EMAIL_REPLY_TO?.trim();

  if (!recipient) {
    return NextResponse.json(
      {
        ok: false,
        error: 'AUTH_EMAIL_REPLY_TO is missing.'
      },
      { status: 503 }
    );
  }

  try {
    const result = await sendTransactionalEmail({
      to: recipient,
      subject: 'Shelsea email transport test',
      html: `
        <h1>Shelsea email test</h1>
        <p>The transactional email transport is working.</p>
      `,
      text: 'Shelsea transactional email transport is working.',
      category: 'email_verification',
      idempotencyKey: `dev-email-test-${Date.now()}`
    });

    return NextResponse.json({
      ok: true,
      emailId: result.id
    });
  } catch (error) {
    console.error('[dev-email-test]', error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unknown email error.'
      },
      { status: 500 }
    );
  }
}