import AuthCard from '@/components/auth/AuthCard';
import AuthExperienceShell from '@/components/auth/AuthExperienceShell';
import SignUpForm from '@/components/auth/SignUpForm';

export default function SignUpPage() {
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const emailVerificationEnabled = process.env.AUTH_EMAIL_ENABLED?.trim().toLowerCase() === 'true';
  return (
    <AuthExperienceShell>
      <AuthCard
        eyebrow="Shelsea Membership"
        title="Create your account"
        description="Save products, continue your cart, track orders and receive a personal Shelsea experience.">
        <SignUpForm googleEnabled={googleEnabled} emailVerificationEnabled={emailVerificationEnabled} />
      </AuthCard>
    </AuthExperienceShell>
  );
}
