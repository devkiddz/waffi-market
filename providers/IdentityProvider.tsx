'use client';

import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';

import { useRouter } from 'next/navigation';

import { authClient } from '@/lib/auth-client';

type IdentityUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  tier: string;
  emailVerified: boolean;
};

type IdentityContextValue = {
  user: IdentityUser | null;
  isAuthenticated: boolean;
  isPending: boolean;
  signOut: () => Promise<void>;
};

const IdentityContext = createContext<IdentityContextValue | null>(null);

type IdentityProviderProps = {
  children: ReactNode;
};

export default function IdentityProvider({ children }: IdentityProviderProps) {
  const router = useRouter();

  const { data: session, isPending } = authClient.useSession();

  const signOut = useCallback(async () => {
    await authClient.signOut();

    router.push('/');
    router.refresh();
  }, [router]);

  const value = useMemo<IdentityContextValue>(
    () => ({
      user: session
        ? {
            id: session.user.id,

            name: session.user.name ?? 'Shelsea Member',

            email: session.user.email,

            image: session.user.image,

            tier: typeof session.user.tier === 'string' ? session.user.tier : 'member',

            emailVerified: session.user.emailVerified
          }
        : null,

      isAuthenticated: Boolean(session),

      isPending,

      signOut
    }),
    [session, isPending, signOut]
  );

  return <IdentityContext.Provider value={value}>{children}</IdentityContext.Provider>;
}

export function useIdentity() {
  const context = useContext(IdentityContext);

  if (!context) {
    throw new Error('useIdentity must be used inside IdentityProvider.');
  }

  return context;
}
