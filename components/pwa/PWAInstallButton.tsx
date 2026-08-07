'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Download, MonitorDown, Share2, Smartphone } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type InstallChoice = {
  outcome: 'accepted' | 'dismissed';
  platform: string;
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<InstallChoice>;
};

type PWAInstallButtonProps = {
  className?: string;
};

function runningStandalone(): boolean {
  if (typeof window === 'undefined') return false;

  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    navigatorWithStandalone.standalone === true
  );
}

export function PWAInstallButton({ className }: PWAInstallButtonProps) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    setInstalled(runningStandalone());
    setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent));

    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setInstallPrompt(null);
      setInstalled(true);
      setInstructionsOpen(false);
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const requestInstall = async () => {
    if (installed) return;

    if (!installPrompt) {
      setInstructionsOpen(true);
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);

    if (choice.outcome === 'accepted') {
      setInstalled(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => void requestInstall()}
        disabled={installed}
        className={cn(
          'inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border/70 bg-background/80 px-4 text-sm font-bold shadow-sm transition',
          installed
            ? 'cursor-default text-emerald-600 dark:text-emerald-300'
            : 'hover:border-primary/35 hover:bg-muted',
          className
        )}>
        {installed ? <CheckCircle2 className="size-4" /> : <Download className="size-4" />}
        {installed ? 'Shelsea installed' : 'Install Shelsea'}
      </button>

      <Dialog open={instructionsOpen} onOpenChange={setInstructionsOpen}>
        <DialogContent className="w-[min(92vw,30rem)] rounded-3xl p-6 sm:p-7">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {isIOS ? <Smartphone className="size-5" /> : <MonitorDown className="size-5" />}
          </div>

          <div>
            <DialogTitle className="text-xl font-black">Install Shelsea</DialogTitle>
            <DialogDescription className="mt-2 leading-6">
              {isIOS
                ? 'Safari handles installation from its Share menu.'
                : 'Your browser has not exposed the automatic install prompt yet.'}
            </DialogDescription>
          </div>

          {isIOS ? (
            <div className="rounded-2xl border border-border/70 bg-muted/35 p-4 text-sm leading-6">
              <p className="flex items-center gap-2 font-bold">
                <Share2 className="size-4" />
                In Safari
              </p>
              <p className="mt-2 text-muted-foreground">
                Tap Share, choose <strong className="text-foreground">Add to Home Screen</strong>, then confirm Add.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-border/70 bg-muted/35 p-4 text-sm leading-6 text-muted-foreground">
              Open the browser menu and choose <strong className="text-foreground">Install Shelsea</strong> or <strong className="text-foreground">Install app</strong>. On mobile, use <strong className="text-foreground">Add to Home screen</strong>.
            </div>
          )}

          <p className="text-xs leading-5 text-muted-foreground">
            Installation is available from the secure Vercel deployment or from localhost during development testing.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
