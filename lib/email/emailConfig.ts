import 'server-only';

type TransactionalEmailConfig = {
  apiKey: string;
  from: string;
  replyTo?: string;
};

export function isAuthEmailEnabled(): boolean {
  if (process.env.AUTH_EMAIL_ENABLED?.trim().toLowerCase() !== 'true') return false;

  if (!process.env.RESEND_API_KEY?.trim() || !process.env.AUTH_EMAIL_FROM?.trim()) {
    throw new Error(
      'AUTH_EMAIL_ENABLED is true, but RESEND_API_KEY or AUTH_EMAIL_FROM is missing. Configure email delivery or set AUTH_EMAIL_ENABLED=false explicitly.'
    );
  }

  return true;
}

export function getTransactionalEmailConfig(): TransactionalEmailConfig {
  if (!isAuthEmailEnabled()) {
    throw new Error(
      'Authentication email is not configured. Set AUTH_EMAIL_ENABLED, RESEND_API_KEY and AUTH_EMAIL_FROM.'
    );
  }

  return {
    apiKey: process.env.RESEND_API_KEY!.trim(),
    from: process.env.AUTH_EMAIL_FROM!.trim(),
    replyTo: process.env.AUTH_EMAIL_REPLY_TO?.trim() || undefined
  };
}
