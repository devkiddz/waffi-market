import AuthCard from '@/components/auth/AuthCard';
import AuthExperienceShell from '@/components/auth/AuthExperienceShell';
import SignInForm from '@/components/auth/SignInForm';

export default function SignInPage() {
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  return (
    <AuthExperienceShell>
      <AuthCard
        eyebrow="Welcome Back"
        title="Sign in to Shelsea"
        description="Continue your shopping journey, saved products, active orders and personal recommendations.">
        <SignInForm googleEnabled={googleEnabled} />
      </AuthCard>
    </AuthExperienceShell>
  );
}
