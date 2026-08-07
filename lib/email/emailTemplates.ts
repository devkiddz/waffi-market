type AuthEmailTemplateInput = {
  name?: string | null;
  actionUrl: string;
};

type TransactionalEmailTemplate = {
  subject: string;
  html: string;
  text: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderEmailShell({
  preheader,
  eyebrow,
  title,
  body,
  actionLabel,
  actionUrl,
  footer
}: {
  preheader: string;
  eyebrow: string;
  title: string;
  body: string;
  actionLabel: string;
  actionUrl: string;
  footer: string;
}): string {
  const safeActionUrl = escapeHtml(actionUrl);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;background:#07111f;color:#f8fafc;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#07111f;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;border:1px solid rgba(255,255,255,.12);border-radius:24px;background:#0d1b2d;overflow:hidden;">
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 12px;color:#d4a85f;font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;">${escapeHtml(eyebrow)}</p>
                <h1 style="margin:0;color:#ffffff;font-size:28px;line-height:1.2;">${escapeHtml(title)}</h1>
                <div style="margin-top:18px;color:#cbd5e1;font-size:15px;line-height:1.7;">${body}</div>
                <div style="margin-top:28px;">
                  <a href="${safeActionUrl}" style="display:inline-block;border-radius:14px;background:#d4a85f;color:#07111f;padding:14px 22px;font-size:14px;font-weight:700;text-decoration:none;">${escapeHtml(actionLabel)}</a>
                </div>
                <p style="margin:24px 0 0;color:#94a3b8;font-size:12px;line-height:1.6;">If the button does not open, copy this link into your browser:<br /><a href="${safeActionUrl}" style="color:#d4a85f;word-break:break-all;">${safeActionUrl}</a></p>
              </td>
            </tr>
            <tr>
              <td style="border-top:1px solid rgba(255,255,255,.1);padding:20px 32px;color:#64748b;font-size:12px;line-height:1.6;">${escapeHtml(footer)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function buildEmailVerificationTemplate({
  name,
  actionUrl
}: AuthEmailTemplateInput): TransactionalEmailTemplate {
  const greeting = name?.trim() ? `Hello ${escapeHtml(name.trim())},` : 'Hello,';
  const subject = 'Verify your Shelsea Commerce email';

  return {
    subject,
    html: renderEmailShell({
      preheader: 'Confirm your email address to activate your Shelsea Commerce account.',
      eyebrow: 'Shelsea Commerce Membership',
      title: 'Verify your email address',
      body: `<p style="margin:0 0 12px;">${greeting}</p><p style="margin:0;">Confirm this email address to protect your account and continue your Shelsea Commerce experience.</p>`,
      actionLabel: 'Verify email',
      actionUrl,
      footer: 'This verification link expires in one hour. If you did not create an Shelsea Commerce account, you can ignore this email.'
    }),
    text: `${name?.trim() ? `Hello ${name.trim()},` : 'Hello,'}\n\nVerify your Shelsea Commerce email address:\n${actionUrl}\n\nThis link expires in one hour. If you did not create an Shelsea Commerce account, ignore this email.`
  };
}

export function buildPasswordResetTemplate({
  name,
  actionUrl
}: AuthEmailTemplateInput): TransactionalEmailTemplate {
  const greeting = name?.trim() ? `Hello ${escapeHtml(name.trim())},` : 'Hello,';
  const subject = 'Reset your Shelsea Commerce password';

  return {
    subject,
    html: renderEmailShell({
      preheader: 'Use this secure link to reset your Shelsea Commerce password.',
      eyebrow: 'Account Security',
      title: 'Reset your password',
      body: `<p style="margin:0 0 12px;">${greeting}</p><p style="margin:0;">A password reset was requested for your Shelsea Commerce account. Use the secure button below to choose a new password.</p>`,
      actionLabel: 'Reset password',
      actionUrl,
      footer: 'This reset link expires in one hour and can only be used once. If you did not request it, your password remains unchanged.'
    }),
    text: `${name?.trim() ? `Hello ${name.trim()},` : 'Hello,'}\n\nReset your Shelsea Commerce password:\n${actionUrl}\n\nThis link expires in one hour and can only be used once. If you did not request it, your password remains unchanged.`
  };
}
