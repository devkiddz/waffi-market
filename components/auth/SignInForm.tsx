'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useEffect, useState, type FormEvent } from 'react';

import { ArrowRight, LoaderCircle, MailWarning, RefreshCw } from 'lucide-react';

import { readAuthReturnTo } from '@/features/action-feedback';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

import AuthNotice from './AuthNotice';
import GoogleAuthButton from './GoogleAuthButton';
import PasswordField from './PasswordField';

type SignInFormProps = {
  callbackURL?: string;
  showAdminLink?: boolean;
  googleEnabled?: boolean;
};

type NoticeState = {
  variant: 'error' | 'warning' | 'success' | 'info';
  title: string;
  description: string;
};

function createAuthHref(pathname: string, returnTo: string): string {
  const params = new URLSearchParams({
    returnTo
  });

  return `${pathname}?${params.toString()}`;
}

export default function SignInForm({
  callbackURL = '/account',
  showAdminLink = true,
  googleEnabled = false
}: SignInFormProps) {
  const router = useRouter();

  const [returnTo, setReturnTo] = useState(callbackURL);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const [notice, setNotice] = useState<NoticeState | null>(null);

  const [verificationNotice, setVerificationNotice] = useState<NoticeState | null>(null);

  const [needsVerification, setNeedsVerification] = useState(false);

  const [pending, setPending] = useState(false);

  const [resendingVerification, setResendingVerification] = useState(false);

  useEffect(() => {
    setReturnTo(readAuthReturnTo(callbackURL));
  }, [callbackURL]);

  const resetFeedback = (): void => {
    setNotice(null);
    setVerificationNotice(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    resetFeedback();
    setNeedsVerification(false);
    setPending(true);

    const normalizedEmail = email.trim().toLowerCase();
    const destination = readAuthReturnTo(callbackURL);

    try {
      const { error } = await authClient.signIn.email({
        email: normalizedEmail,
        password,
        rememberMe,
        callbackURL: destination
      });

      if (error) {
        const errorCode = error.code?.toUpperCase() ?? '';

        const errorMessage = error.message?.toLowerCase() ?? '';

        const errorStatus = Number(error.status);

        const isEmailVerificationError =
          errorCode === 'EMAIL_NOT_VERIFIED' ||
          errorStatus === 403 ||
          errorMessage.includes('email not verified') ||
          errorMessage.includes('verify your email');

        if (isEmailVerificationError) {
          setNeedsVerification(true);

          setNotice({
            variant: 'warning',
            title: 'Your email is not verified',
            description:
              'Verify this address before entering your account. You can request another email below.'
          });

          return;
        }

        const invalidCredentials =
          errorCode.includes('INVALID_EMAIL') ||
          errorCode.includes('INVALID_PASSWORD') ||
          errorCode.includes('INVALID_CREDENTIALS') ||
          errorCode.includes('USER_NOT_FOUND') ||
          errorStatus === 401 ||
          errorMessage.includes('incorrect') ||
          errorMessage.includes('invalid credentials') ||
          errorMessage.includes('invalid email') ||
          errorMessage.includes('invalid password');

        setNotice({
          variant: 'error',
          title: invalidCredentials ? 'We could not sign you in' : 'Sign in was interrupted',
          description: invalidCredentials
            ? 'The email or password did not match an account. Check both fields and try again.'
            : (error.message ?? 'Please wait a moment and try signing in again.')
        });

        return;
      }

      router.push(destination);
      router.refresh();
    } catch {
      setNotice({
        variant: 'error',
        title: 'Something went wrong',
        description: 'The sign-in request could not be completed. Please try again.'
      });
    } finally {
      setPending(false);
    }
  };

  const handleResendVerification = async (): Promise<void> => {
    const normalizedEmail = email.trim().toLowerCase();
    const destination = readAuthReturnTo(callbackURL);

    if (!normalizedEmail) {
      setVerificationNotice({
        variant: 'warning',
        title: 'Enter your email first',
        description: 'We need the address connected to your account.'
      });

      return;
    }

    setResendingVerification(true);
    setVerificationNotice(null);

    try {
      const { error } = await authClient.sendVerificationEmail({
        email: normalizedEmail,
        callbackURL: destination
      });

      if (error) {
        setVerificationNotice({
          variant: 'error',
          title: 'The email was not sent',
          description: error.message ?? 'Please wait a moment and try again.'
        });

        return;
      }

      setVerificationNotice({
        variant: 'success',
        title: 'Verification email sent',
        description: 'Check your inbox and spam folder, then return here to sign in.'
      });
    } catch {
      setVerificationNotice({
        variant: 'error',
        title: 'Delivery was interrupted',
        description: 'Your account was not changed. Retry the verification email.'
      });
    } finally {
      setResendingVerification(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <GoogleAuthButton callbackURL={returnTo} enabled={googleEnabled} label="Continue with Google" />

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
            resetFeedback();
            setNeedsVerification(false);
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
        <div className="flex items-center justify-between gap-4">
          <label htmlFor="password" className="text-sm font-semibold text-foreground">
            Password
          </label>

          <span className="text-xs text-muted-foreground">Password recovery follows next</span>
        </div>

        <PasswordField
          id="password"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={event => {
            setPassword(event.target.value);
            resetFeedback();
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
          placeholder="Enter your password"
        />
      </div>

      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/50 bg-background/30 px-3.5 py-3 text-sm text-muted-foreground transition hover:bg-background/50">
        <input
          type="checkbox"
          checked={rememberMe}
          onChange={event => setRememberMe(event.target.checked)}
          className="size-4 rounded border-border accent-primary"
        />

        <span>Keep me signed in on this device</span>
      </label>

      {notice ? (
        <AuthNotice variant={notice.variant} title={notice.title} description={notice.description} />
      ) : null}

      {needsVerification ? (
        <div className="space-y-3 rounded-2xl border border-border/70 bg-background/35 p-4 shadow-inner backdrop-blur-md">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <MailWarning className="size-4" />
            </span>

            <div>
              <p className="text-sm font-semibold text-foreground">Verification required</p>

              <p className="mt-1 text-sm leading-5 text-muted-foreground">
                Request another secure verification link for the email entered above.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={resendingVerification}
            onClick={handleResendVerification}
            className={cn(
              'flex h-10 w-full items-center justify-center gap-2',
              'rounded-xl border border-border/70',
              'bg-background/60 px-3',
              'text-sm font-semibold text-foreground',
              'shadow-sm transition duration-300',
              'hover:border-primary/35 hover:bg-primary/10',
              'disabled:cursor-not-allowed disabled:opacity-60'
            )}>
            {resendingVerification ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}

            {resendingVerification ? 'Sending verification email...' : 'Resend verification email'}
          </button>

          {verificationNotice ? (
            <AuthNotice
              variant={verificationNotice.variant}
              title={verificationNotice.title}
              description={verificationNotice.description}
            />
          ) : null}
        </div>
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

        {pending ? 'Signing you in...' : 'Sign in'}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        New to Shelsea?{' '}
        <Link
          href={createAuthHref('/sign-up', returnTo)}
          className="font-semibold text-primary transition hover:opacity-80">
          Create an account
        </Link>
      </p>

      {showAdminLink ? (
        <div className="border-t border-border/60 pt-4 text-center">
          <p className="text-xs text-muted-foreground">
            Staff member?{' '}
            <Link
              href="/adminlogin/login"
              className="inline-flex items-center gap-1 font-semibold text-primary transition hover:opacity-80">
              Open admin login
              <ArrowRight className="size-3" />
            </Link>
          </p>
        </div>
      ) : null}
    </form>
  );
}
