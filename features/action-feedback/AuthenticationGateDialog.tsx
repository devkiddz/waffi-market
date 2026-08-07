'use client';

import { ArrowRight, Check, LogIn, Sparkles, UserPlus } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import type { AuthenticationGateRequest } from './actionFeedbackTypes';

type AuthenticationGateDialogProps = {
  request: AuthenticationGateRequest | null;
  onDismiss: () => void;
  onSignIn: () => void;
  onSignUp: () => void;
};

const defaultBenefits = [
  'Save your activity and continue across devices.',
  'Preserve your wishlist, rewards and experience history.',
  'Unlock Shelsea member and test-mode benefits.'
];

export function AuthenticationGateDialog({
  request,
  onDismiss,
  onSignIn,
  onSignUp
}: AuthenticationGateDialogProps) {
  const benefits = request?.copy?.benefits ?? defaultBenefits;

  const title = request?.copy?.title ?? request?.action.title ?? 'Sign in to continue';

  const description =
    request?.copy?.description ??
    request?.action.description ??
    'This action belongs to your personal Shelsea experience. Sign in or create an account to continue securely.';

  return (
    <Dialog
      open={Boolean(request)}
      onOpenChange={open => {
        if (!open) {
          onDismiss();
        }
      }}>
      <DialogContent className="overflow-hidden border-primary/10 p-0 sm:max-w-md">
        <div className="relative overflow-hidden border-b bg-gradient-to-br from-primary/10 via-card to-card px-6 py-7">
          <div className="absolute -right-12 -top-12 size-36 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative">
            <div className="grid size-11 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
              <Sparkles className="size-5" />
            </div>

            <DialogHeader className="mt-5 text-left">
              <DialogTitle className="text-xl">{title}</DialogTitle>

              <DialogDescription className="max-w-sm leading-6">{description}</DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <div className="space-y-5 p-6">
          <div className="space-y-3">
            {benefits.map(benefit => (
              <div key={benefit} className="flex items-start gap-3">
                <div className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  <Check className="size-3" />
                </div>

                <p className="text-sm leading-5 text-muted-foreground">{benefit}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-3">
            <Button type="button" size="lg" onClick={onSignUp} className="w-full justify-between rounded-xl">
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
              onClick={onSignIn}
              className="w-full justify-between rounded-xl">
              <span className="flex items-center gap-2">
                <LogIn className="size-4" />
                Sign in
              </span>

              <ArrowRight className="size-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={onDismiss}
              className="w-full rounded-xl text-muted-foreground">
              Continue browsing
            </Button>
          </div>

          <p className="text-center text-xs leading-5 text-muted-foreground">
            Your pending action is preserved when you choose Sign in or Create account.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
