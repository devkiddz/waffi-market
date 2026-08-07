'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useEffect, useMemo, useState, type FormEvent } from 'react';

import { ArrowRight, LoaderCircle, MailCheck, RefreshCw } from 'lucide-react';

import { readAuthReturnTo } from '@/features/action-feedback';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

import AuthNotice from './AuthNotice';
import GoogleAuthButton from './GoogleAuthButton';
import PasswordField from './PasswordField';

type SignUpFormProps = {
  callbackURL?: string;
  googleEnabled?: boolean;
  emailVerificationEnabled?: boolean;
};

type NoticeState = {
  variant: 'error' | 'warning' | 'success' | 'info';
  title: string;
  description: string;
};

type VerificationDeliveryState = 'idle' | 'sending' | 'sent' | 'failed';

function createAuthHref(pathname: string, returnTo: string): string {
  const params = new URLSearchParams({
    returnTo
  });

  return `${pathname}?${params.toString()}`;
}

export default function SignUpForm({
  callbackURL = '/account',
  googleEnabled = false,
  emailVerificationEnabled = false
}: SignUpFormProps) {
  const router = useRouter();

  const [returnTo, setReturnTo] = useState(callbackURL);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);

  const [verificationDeliveryState, setVerificationDeliveryState] =
    useState<VerificationDeliveryState>('idle');

  const [notice, setNotice] = useState<NoticeState | null>(null);

  const [pending, setPending] = useState(false);

  const [resendingVerification, setResendingVerification] = useState(false);

  useEffect(() => {
    setReturnTo(readAuthReturnTo(callbackURL));
  }, [callbackURL]);

  const passwordStrength = useMemo(() => {
    let level = 0;

    if (password.length >= 8) {
      level += 1;
    }

    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
      level += 1;
    }

    if (/\d/.test(password)) {
      level += 1;
    }

    if (/[^A-Za-z0-9]/.test(password)) {
      level += 1;
    }

    const labels = ['Enter a password', 'Basic', 'Fair', 'Strong', 'Excellent'];

    return {
      level,
      label: labels[level]
    };
  }, [password]);

  const clearNotice = (): void => {
    if (notice) {
      setNotice(null);
    }
  };

  const sendVerificationEmail = async (recipientEmail: string, destination: string): Promise<boolean> => {
    const { error } = await authClient.sendVerificationEmail({
      email: recipientEmail,
      callbackURL: destination
    });

    return !error;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    setNotice(null);

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const destination = readAuthReturnTo(callbackURL);

    if (!normalizedName) {
      setNotice({
        variant: 'warning',
        title: 'Your name is required',
        description: 'Enter the name you would like connected to your Shelsea account.'
      });

      return;
    }

    if (password.length < 8) {
      setNotice({
        variant: 'warning',
        title: 'Your password is too short',
        description: 'Use at least eight characters to protect your account.'
      });

      return;
    }

    if (password !== confirmPassword) {
      setNotice({
        variant: 'warning',
        title: 'The passwords do not match',
        description: 'Re-enter the same password in both password fields.'
      });

      return;
    }

    setPending(true);

    try {
      const result = await authClient.signUp.email({
        name: normalizedName,
        email: normalizedEmail,
        password,
        callbackURL: destination
      });

      if (result.error) {
        const errorCode = result.error.code?.toUpperCase() ?? '';

        const errorText = result.error.message?.toLowerCase() ?? '';

        const errorStatus = Number(result.error.status);

        const accountExists =
          errorCode.includes('USER_ALREADY_EXISTS') ||
          errorCode.includes('EMAIL_ALREADY_EXISTS') ||
          errorText.includes('already exists') ||
          errorText.includes('already registered') ||
          errorStatus === 409;

        const possiblyExistingAccount = accountExists || errorStatus === 422 || errorText === 'not found';

        if (possiblyExistingAccount) {
          setNotice({
            variant: 'warning',
            title: accountExists ? 'This account already exists' : 'This email may already be registered',
            description:
              'Try signing in instead. You can verify or recover the account from the sign-in experience.'
          });

          return;
        }

        setNotice({
          variant: 'error',
          title: 'Your account could not be created',
          description:
            result.error.message ?? result.error.statusText ?? 'Please check your details and try again.'
        });

        return;
      }

      if (emailVerificationEnabled) {
        setVerificationEmail(normalizedEmail);
        setVerificationDeliveryState('sending');

        setPassword('');
        setConfirmPassword('');

        try {
          const sent = await sendVerificationEmail(normalizedEmail, destination);

          setVerificationDeliveryState(sent ? 'sent' : 'failed');
        } catch {
          setVerificationDeliveryState('failed');
        }

        return;
      }

      router.push(destination);
      router.refresh();
    } catch (error) {
      setNotice({
        variant: 'error',
        title: 'Something interrupted registration',
        description: error instanceof Error ? error.message : 'Please try creating your account again.'
      });
    } finally {
      setPending(false);
    }
  };

  const handleResendVerification = async (): Promise<void> => {
    if (!verificationEmail) {
      return;
    }

    const destination = readAuthReturnTo(callbackURL);

    setResendingVerification(true);
    setVerificationDeliveryState('sending');

    try {
      const sent = await sendVerificationEmail(verificationEmail, destination);

      setVerificationDeliveryState(sent ? 'sent' : 'failed');
    } catch {
      setVerificationDeliveryState('failed');
    } finally {
      setResendingVerification(false);
    }
  };

  const handleUseDifferentEmail = (): void => {
    setVerificationEmail(null);
    setVerificationDeliveryState('idle');
    setNotice(null);
  };

  if (verificationEmail) {
    return (
      <div className="space-y-5">
        <div className="flex flex-col items-center text-center">
          <div className="grid size-16 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-lg shadow-primary/10">
            <MailCheck className="size-7" />
          </div>

          <h2 className="mt-5 text-xl font-bold tracking-tight text-foreground">Check your email</h2>

          <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
            Your account was created. Complete verification to securely enter your Shelsea experience.
          </p>
        </div>

        <div className="rounded-2xl border border-border/70 bg-background/45 p-4 text-center shadow-inner backdrop-blur-md">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Verification address
          </p>

          <p className="mt-2 break-all text-sm font-semibold text-foreground">{verificationEmail}</p>
        </div>

        {verificationDeliveryState === 'sending' ? (
          <AuthNotice
            variant="info"
            title="Sending your verification email"
            description="Keep this page open while we contact the email service."
          />
        ) : null}

        {verificationDeliveryState === 'sent' ? (
          <AuthNotice
            variant="success"
            title="Verification email sent"
            description="Open the message and select the verification link. Check your spam folder if it is not visible."
          />
        ) : null}

        {verificationDeliveryState === 'failed' ? (
          <AuthNotice
            variant="warning"
            title="Your account exists, but delivery failed"
            description="Nothing was lost. Retry the email without creating another account."
          />
        ) : null}

        <button
          type="button"
          disabled={resendingVerification || verificationDeliveryState === 'sending'}
          onClick={handleResendVerification}
          className={cn(
            'flex h-12 w-full items-center justify-center gap-2',
            'rounded-xl border border-border/70',
            'bg-background/55 px-4',
            'text-sm font-semibold text-foreground',
            'shadow-sm backdrop-blur-md',
            'transition duration-300',
            'hover:-translate-y-0.5 hover:border-primary/35',
            'hover:bg-primary/10',
            'disabled:cursor-not-allowed disabled:opacity-60'
          )}>
          {resendingVerification || verificationDeliveryState === 'sending' ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}

          {resendingVerification || verificationDeliveryState === 'sending'
            ? 'Sending verification email...'
            : 'Resend verification email'}
        </button>

        <Link
          href={createAuthHref('/sign-in', returnTo)}
          className={cn(
            'flex h-12 w-full items-center justify-center gap-2',
            'rounded-xl bg-primary px-4',
            'text-sm font-semibold text-primary-foreground',
            'shadow-lg shadow-primary/20',
            'transition duration-300',
            'hover:-translate-y-0.5 hover:opacity-95'
          )}>
          Continue to sign in
          <ArrowRight className="size-4" />
        </Link>

        <button
          type="button"
          onClick={handleUseDifferentEmail}
          className="w-full text-center text-sm font-medium text-muted-foreground transition hover:text-foreground">
          Use a different email address
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <GoogleAuthButton callbackURL={returnTo} enabled={googleEnabled} label="Sign up with Google" />

      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-semibold text-foreground">
          Full name
        </label>

        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          value={name}
          onChange={event => {
            setName(event.target.value);
            clearNotice();
          }}
          className={cn(
            'h-12 w-full rounded-xl',
            'border border-border/70',
            'bg-background/45 px-4 text-sm',
            'text-foreground shadow-inner',
            'outline-none backdrop-blur-md',
            'transition duration-300',
            'placeholder:text-muted-foreground/60',
            'focus:border-primary/60',
            'focus:ring-4 focus:ring-primary/10'
          )}
          placeholder="Dennis Okaro Jones"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-semibold text-foreground">
          Email address
        </label>

        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={event => {
            setEmail(event.target.value);
            clearNotice();
          }}
          className={cn(
            'h-12 w-full rounded-xl',
            'border border-border/70',
            'bg-background/45 px-4 text-sm',
            'text-foreground shadow-inner',
            'outline-none backdrop-blur-md',
            'transition duration-300',
            'placeholder:text-muted-foreground/60',
            'focus:border-primary/60',
            'focus:ring-4 focus:ring-primary/10'
          )}
          placeholder="you@example.com"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-semibold text-foreground">
          Password
        </label>

        <PasswordField
          id="password"
          name="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={event => {
            setPassword(event.target.value);
            clearNotice();
          }}
          className={cn(
            'h-12 w-full rounded-xl',
            'border border-border/70',
            'bg-background/45 px-4 text-sm',
            'text-foreground shadow-inner',
            'outline-none backdrop-blur-md',
            'transition duration-300',
            'placeholder:text-muted-foreground/60',
            'focus:border-primary/60',
            'focus:ring-4 focus:ring-primary/10'
          )}
          placeholder="At least 8 characters"
        />

        {password ? (
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-4 gap-1.5">
              {[1, 2, 3, 4].map(level => (
                <span
                  key={level}
                  className={cn(
                    'h-1 rounded-full transition-colors',
                    passwordStrength.level >= level ? 'bg-primary' : 'bg-muted'
                  )}
                />
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              Password strength:{' '}
              <span className="font-semibold text-foreground">{passwordStrength.label}</span>
            </p>
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="text-sm font-semibold text-foreground">
          Confirm password
        </label>

        <PasswordField
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={event => {
            setConfirmPassword(event.target.value);
            clearNotice();
          }}
          className={cn(
            'h-12 w-full rounded-xl',
            'border border-border/70',
            'bg-background/45 px-4 text-sm',
            'text-foreground shadow-inner',
            'outline-none backdrop-blur-md',
            'transition duration-300',
            'placeholder:text-muted-foreground/60',
            'focus:border-primary/60',
            'focus:ring-4 focus:ring-primary/10'
          )}
          placeholder="Repeat your password"
        />
      </div>

      {notice ? (
        <AuthNotice variant={notice.variant} title={notice.title} description={notice.description}>
          {notice.variant === 'warning' && notice.title.toLowerCase().includes('account') ? (
            <Link
              href={createAuthHref('/sign-in', returnTo)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold underline underline-offset-4">
              Open sign in
              <ArrowRight className="size-3.5" />
            </Link>
          ) : null}
        </AuthNotice>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className={cn(
          'flex h-12 w-full items-center justify-center gap-2',
          'rounded-xl bg-primary px-4',
          'text-sm font-semibold text-primary-foreground',
          'shadow-lg shadow-primary/20',
          'transition duration-300',
          'hover:-translate-y-0.5 hover:opacity-95',
          'disabled:cursor-not-allowed',
          'disabled:translate-y-0 disabled:opacity-60'
        )}>
        {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}

        {pending ? 'Creating your account...' : 'Create account'}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          href={createAuthHref('/sign-in', returnTo)}
          className="font-semibold text-primary transition hover:opacity-80">
          Sign in
        </Link>
      </p>
    </form>
  );
}
