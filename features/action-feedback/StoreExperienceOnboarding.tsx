'use client';

import Image from 'next/image';

import {
  ArrowRight,
  Check,
  CircleDollarSign,
  History,
  Layers3,
  LogIn,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  TestTube2,
  UserPlus,
  type LucideIcon
} from 'lucide-react';

import { useEffect, useMemo, useState } from 'react';

import { usePathname, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { cn } from '@/lib/utils';

import { useIdentity } from '@/providers/IdentityProvider';

import {
  completeExperienceOnboarding,
  readExperienceOnboardingState,
  recordExperienceOnboardingPath,
  shouldShowExperienceOnboarding
} from './actionFeedbackStorage';

import { buildAuthHref } from './authNavigation';

type StoreExperienceOnboardingProps = {
  suppressed?: boolean;
};

type ExperienceModeId = 'live' | 'demo' | 'practice';

type OnboardingVisibility = {
  pathname: string;
  open: boolean;
};

type ExperienceMode = {
  id: ExperienceModeId;

  label: string;
  badge: string;

  title: string;
  description: string;

  availability: string;

  icon: LucideIcon;

  benefits: string[];
};

const experienceModes: ExperienceMode[] = [
  {
    id: 'live',

    label: 'Live',
    badge: 'Real shopping',

    title: 'Shop Shelsea as a real customer',

    description:
      'Live is your real shopping experience. Browse products, build your cart, place orders and enjoy the active Shelsea Store.',

    availability: 'Available to guests and registered customers.',

    icon: ShoppingBag,

    benefits: [
      'Browse the active Shelsea product catalogue.',
      'Preview products and build a real shopping cart.',
      'Preserve orders, rewards and account activity when signed in.'
    ]
  },

  {
    id: 'demo',

    label: 'Demo',
    badge: 'Guided experience',

    title: 'See more of what Shelsea can do',

    description:
      'Demo gives you a guided view of Shelsea with prepared products, campaigns, customer activity, orders and shopping scenarios already in motion.',

    availability: 'Demo access will be enabled progressively for registered testers.',

    icon: TestTube2,

    benefits: [
      'Explore prepared customer and shopping scenarios.',
      'Discover wider Shelsea features and experiences.',
      'Test freely without changing your real Live activity.'
    ]
  },

  {
    id: 'practice',

    label: 'Practice',
    badge: 'Safe test space',

    title: 'Try complete shopping journeys safely',

    description:
      'Practice gives registered users a private space to experiment with shopping actions, simulated value and complete Shelsea journeys without affecting Live activity.',

    availability: 'Practice access will be introduced progressively for registered users.',

    icon: CircleDollarSign,

    benefits: [
      'Use isolated cart, wishlist and activity records.',
      'Try complete journeys without affecting Live data.',
      'Learn how Shelsea works at your own pace.'
    ]
  }
];

const accountBenefits = [
  {
    icon: Sparkles,

    title: 'Discover what suits you',

    description:
      'Shelsea can use your interests and Store activity to surface more relevant products and experiences.'
  },

  {
    icon: History,

    title: 'Continue where you stopped',

    description: 'Return to previous discoveries, carts and assembled experiences without beginning again.'
  },

  {
    icon: Layers3,

    title: 'Explore more Shelsea modes',

    description:
      'Registered testers may receive access to Live, Demo and Practice experiences as they become available.'
  },

  {
    icon: ShieldCheck,

    title: 'Keep your benefits connected',

    description: 'Preserve your wishlist, rewards, orders and customer-owned activity securely across visits.'
  }
];

export function StoreExperienceOnboarding({ suppressed = false }: StoreExperienceOnboardingProps) {
  const router = useRouter();
  const pathname = usePathname();

  const { isAuthenticated, isPending } = useIdentity();

  const [
    onboardingVisibility,
    setOnboardingVisibility
  ] = useState<OnboardingVisibility | null>(
    null
  );

  const open =
    onboardingVisibility?.pathname ===
      pathname &&
    onboardingVisibility.open;

  const [activeModeId, setActiveModeId] = useState<ExperienceModeId>('live');

  const activeMode = useMemo(
    () => experienceModes.find(mode => mode.id === activeModeId) ?? experienceModes[0]!,
    [activeModeId]
  );

  useEffect(() => {
    if (isPending) {
      return;
    }

    if (isAuthenticated) {
      completeExperienceOnboarding();

      return;
    }

    if (pathname !== '/store') {
      return;
    }

    const timer = window.setTimeout(() => {
      const onboardingState = readExperienceOnboardingState();

      setOnboardingVisibility({
        pathname,
        open:
          shouldShowExperienceOnboarding(
            onboardingState
          )
      });
    }, 700);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isAuthenticated, isPending, pathname]);

  const continueAsGuest = () => {
    recordExperienceOnboardingPath('guest');
    setOnboardingVisibility({
      pathname,
      open: false
    });
  };

  const goToSignIn = () => {
    recordExperienceOnboardingPath('signin');
    setOnboardingVisibility({
      pathname,
      open: false
    });

    router.push(buildAuthHref('/sign-in', '/store'));
  };

  const goToSignUp = () => {
    recordExperienceOnboardingPath('signup');
    setOnboardingVisibility({
      pathname,
      open: false
    });

    router.push(buildAuthHref('/sign-up', '/store'));
  };

  if (isPending || isAuthenticated || pathname !== '/store') {
    return null;
  }

  const ActiveModeIcon = activeMode.icon;

  return (
    <Dialog
      open={open && !suppressed}
      onOpenChange={nextOpen => {
        if (!nextOpen && open) {
          continueAsGuest();
        }
      }}>
      <DialogContent className="max-h-[calc(100dvh-1rem)] w-[calc(100%_-_1rem)] max-w-none overflow-hidden border-primary/10 p-0 sm:max-w-[96vw] lg:max-w-[1180px] xl:max-w-[1320px]">
        <div className="max-h-[calc(100dvh-1rem)] overflow-y-auto overscroll-contain">
          <div className="grid lg:grid-cols-2">
            {/* =====================================================
                LEFT — HERO AND EXPERIENCE MODES
            ====================================================== */}
            <section className="border-b bg-muted/20 p-4 sm:p-6 lg:border-b-0 lg:border-r lg:p-7">
              {/* SHELSEA SHOPPING HERO */}
              <div className="relative min-h-72 overflow-hidden rounded-3xl border border-white/10 bg-black lg:min-h-80">
                <Image
                  src="/assets/Image-2.png"
                  alt="Shelsea shopping, food and drinks experience"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/70 to-black/20" />

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                <div className="relative flex min-h-72 flex-col justify-between p-6 text-white sm:p-8 lg:min-h-80">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur">
                      Shelsea Guest Welcome
                    </span>

                    <span className="rounded-full border border-white/15 bg-black/20 px-3 py-1 text-xs text-white/75 backdrop-blur">
                      Browse freely
                    </span>
                  </div>

                  <div className="max-w-lg">
                    <p className="text-sm font-medium text-white/70">
                      Your discovery-led shopping experience
                    </p>

                    <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                      Welcome Onboard, Guest!
                    </h1>

                    <p className="mt-4 max-w-md text-sm leading-7 text-white/75 sm:text-base">
                      Explore Shelsea, discover products, build your cart and experience the Store freely.
                      Create an account whenever you are ready to make the journey truly yours.
                    </p>

                    <div className="mt-6 flex flex-wrap gap-2">
                      <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/80 backdrop-blur">
                        Curated discoveries
                      </span>

                      <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/80 backdrop-blur">
                        Guest cart
                      </span>

                      <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/80 backdrop-blur">
                        Personalised journeys
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* EXPERIENCE MODE SELECTOR */}
              <div className="mt-6">
                <div>
                  <p className="text-sm font-semibold text-foreground">Explore Shelsea your way</p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Select a mode to learn what each experience offers.
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {experienceModes.map(mode => {
                    const Icon = mode.icon;

                    const isActive = mode.id === activeModeId;

                    return (
                      <button
                        key={mode.id}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => setActiveModeId(mode.id)}
                        className={cn(
                          'flex min-w-0 flex-col items-center justify-center gap-2 rounded-2xl border px-3 py-4 text-center transition',
                          isActive
                            ? 'border-primary bg-primary text-primary-foreground shadow-md'
                            : 'border-primary/10 bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground'
                        )}>
                        <Icon className="size-5" />

                        <span className="text-sm font-semibold">{mode.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* ACTIVE MODE DETAILS */}
                <div className="mt-4 rounded-3xl border border-primary/10 bg-card p-5">
                  <div className="flex items-start gap-4">
                    <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                      <ActiveModeIcon className="size-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground">{activeMode.title}</p>

                        <span className="rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
                          {activeMode.badge}
                        </span>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-muted-foreground">{activeMode.description}</p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {activeMode.benefits.map(benefit => (
                      <div key={benefit} className="flex items-start gap-3">
                        <div className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                          <Check className="size-3" />
                        </div>

                        <p className="text-sm leading-5 text-muted-foreground">{benefit}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 border-t border-primary/10 pt-4">
                    <p className="text-xs font-medium text-foreground">Access</p>

                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{activeMode.availability}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* =====================================================
                RIGHT — ACCOUNT VALUE AND ACTIONS
            ====================================================== */}
            <section className="bg-background p-6 sm:p-8 lg:p-10">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  Your Shelsea account
                </span>

                <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground">
                  Join anytime
                </span>
              </div>

              <DialogHeader className="mt-6 text-left">
                <DialogTitle className="text-2xl leading-tight sm:text-3xl">
                  Let Shelsea remember the journey you are building.
                </DialogTitle>

                <DialogDescription className="mt-3 text-sm leading-7 sm:text-base">
                  Guest access remains available. Creating an account simply gives your shopping activity a
                  home, allowing Shelsea to preserve your progress and provide a more connected experience.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                {accountBenefits.map(benefit => {
                  const Icon = benefit.icon;

                  return (
                    <div key={benefit.title} className="rounded-3xl border border-primary/10 bg-card p-5">
                      <div className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary">
                        <Icon className="size-5" />
                      </div>

                      <h3 className="mt-4 text-sm font-semibold text-foreground">{benefit.title}</h3>

                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{benefit.description}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 rounded-3xl border border-primary/10 bg-primary/5 p-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-4" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      You are welcome to continue as a guest
                    </p>

                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Browse products, open previews, select variants and use your guest cart freely. You can
                      create an account later when you are ready to preserve the complete experience.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <Button
                  type="button"
                  size="lg"
                  onClick={goToSignUp}
                  className="h-12 justify-between rounded-2xl">
                  <span className="flex items-center gap-2">
                    <UserPlus className="size-4" />
                    Create account
                  </span>

                  <ArrowRight className="size-4" />
                </Button>

                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  onClick={goToSignIn}
                  className="h-12 justify-between rounded-2xl">
                  <span className="flex items-center gap-2">
                    <LogIn className="size-4" />
                    Sign in
                  </span>

                  <ArrowRight className="size-4" />
                </Button>
              </div>

              <Button
                type="button"
                variant="ghost"
                onClick={continueAsGuest}
                className="mt-3 h-11 w-full rounded-2xl text-muted-foreground">
                Continue exploring as a guest
              </Button>

              <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">
                Demo and Practice access may vary during the Shelsea testing rollout.
              </p>
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
