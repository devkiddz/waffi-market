'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import {
  ArrowLeft,
  BadgeCheck,
  Banknote,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  LoaderCircle,
  LockKeyhole,
  PackageCheck,
  ShieldCheck,
  Store,
  Truck
} from 'lucide-react';

import StoreLoadingState from '@/components/loading/StoreLoadingState';
import { useCart } from '@/features/cart';
import { useWorkspace } from '@/features/workspace';
import { cn } from '@/lib/utils';
import { useIdentity } from '@/providers/IdentityProvider';

const currency = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0
});

const deliveryOptions = [
  {
    id: 'AJ_DELIVERY',
    title: 'AJ Delivery',
    description: 'AJ-managed delivery with live progress updates.',
    fee: 2_500,
    icon: Truck
  },
  {
    id: 'PERSONAL_COURIER',
    title: 'My Courier',
    description: 'Your dispatcher scans the delivery barcode before tracking begins.',
    fee: 0,
    icon: PackageCheck
  },
  {
    id: 'STORE_PICKUP',
    title: 'Store pickup',
    description: 'Collect from the store after your order is marked ready.',
    fee: 0,
    icon: Store
  }
] as const;

type DeliveryMethod = (typeof deliveryOptions)[number]['id'];

type PaymentHistoryItem = {
  id: string;
  reference: string;
  provider: string;
  amount: number;
  status: string;
  paidAt: string | null;
  createdAt: string;
  order: {
    orderNumber: string;
    status: string;
    paymentStatus: string;
    total: number;
    createdAt: string;
    delivery: {
      trackingCode: string;
      method: string;
      status: string;
    } | null;
  };
};

async function readResponse<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(data.error ?? 'The request could not be completed.');
  return data;
}

export default function CheckoutExperience() {
  const searchParams = useSearchParams();
  const callbackReference = searchParams.get('reference') || searchParams.get('trxref');
  const { isAuthenticated, isPending } = useIdentity();
  const { activeWorkspace, loading: workspaceLoading } = useWorkspace();
  const { items, subtotal, loading: cartLoading, refreshCart } = useCart();
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('AJ_DELIVERY');
  const [recipientName, setRecipientName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [notes, setNotes] = useState('');
  const [saveAddress, setSaveAddress] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(Boolean(callbackReference));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [history, setHistory] = useState<PaymentHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const verifiedReference = useRef<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (!activeWorkspace?.id || !isAuthenticated) {
      setHistory([]);
      return;
    }

    setHistoryLoading(true);
    try {
      const response = await fetch(`/api/payments?workspaceId=${encodeURIComponent(activeWorkspace.id)}`, {
        cache: 'no-store'
      });
      const data = await readResponse<{ payments: PaymentHistoryItem[] }>(response);
      setHistory(data.payments);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [activeWorkspace, isAuthenticated]);

  useEffect(() => {
    const task = window.setTimeout(() => void loadHistory(), 0);
    return () => window.clearTimeout(task);
  }, [loadHistory]);

  useEffect(() => {
    if (!callbackReference || !isAuthenticated || verifiedReference.current === callbackReference) return;
    verifiedReference.current = callbackReference;
    setVerifying(true);
    setError(null);

    void fetch(`/api/payments/verify?reference=${encodeURIComponent(callbackReference)}`, { cache: 'no-store' })
      .then(response => readResponse<{ orderNumber: string; status: string }>(response))
      .then(async data => {
        setSuccess(`Payment confirmed. Order ${data.orderNumber} is now being prepared.`);
        await Promise.all([refreshCart(), loadHistory()]);
        window.history.replaceState({}, '', '/payments');
      })
      .catch(verificationError => {
        setError(verificationError instanceof Error ? verificationError.message : 'Payment verification failed.');
      })
      .finally(() => setVerifying(false));
  }, [callbackReference, isAuthenticated, loadHistory, refreshCart]);

  if (isPending || workspaceLoading || cartLoading) return <StoreLoadingState label="Preparing secure checkout" />;

  if (!isAuthenticated) {
    return (
      <main className="grid min-h-[70vh] place-items-center px-4 py-12">
        <section className="w-full max-w-lg rounded-[2rem] border border-border/60 bg-card p-7 text-center shadow-xl sm:p-10">
          <LockKeyhole className="mx-auto size-9 text-primary" />
          <h1 className="mt-5 text-3xl font-black">Sign in to checkout</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Payment, delivery tracking and receipts are securely attached to your Shelsea account.</p>
          <Link href="/sign-in?next=/payments" className="mt-7 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-black text-background">Continue to sign in <ChevronRight className="size-4" /></Link>
        </section>
      </main>
    );
  }

  const selectedDelivery = deliveryOptions.find(option => option.id === deliveryMethod) ?? deliveryOptions[0];
  const total = subtotal + selectedDelivery.fee;
  const isLive = activeWorkspace?.mode === 'LIVE';

  const startCheckout = async () => {
    if (!activeWorkspace?.id || submitting || !items.length) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: activeWorkspace.id,
          deliveryMethod,
          recipientName,
          phone,
          addressLine1,
          addressLine2,
          city,
          state,
          notes,
          saveAddress
        })
      });
      const data = await readResponse<{
        reference: string;
        authorizationUrl?: string;
        orderNumber: string;
        paper: boolean;
      }>(response);

      if (data.authorizationUrl) {
        window.location.assign(data.authorizationUrl);
        return;
      }

      setSuccess(`Paper payment completed. Order ${data.orderNumber} is now being prepared.`);
      await Promise.all([refreshCart(), loadHistory()]);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : 'Checkout could not be started.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-[75vh] w-full px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-[1440px]">
        <Link href="/cart" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"><ArrowLeft className="size-4" /> Back to cart</Link>

        <header className="relative mt-5 overflow-hidden rounded-[2rem] border border-border/60 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/.2),transparent_36%),linear-gradient(135deg,hsl(var(--card)),hsl(var(--background)))] p-6 shadow-xl sm:p-9">
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.16em] text-primary"><ShieldCheck className="size-3.5" /> Secure checkout</span>
              <h1 className="mt-5 text-4xl font-black tracking-[-.04em] sm:text-6xl">Complete your shopping moment.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Confirm fulfilment, review the server-calculated total, then continue to Paystack’s protected test checkout.</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/70 p-4 backdrop-blur">
              <p className="text-[9px] font-black uppercase tracking-[.16em] text-muted-foreground">Active experience</p>
              <p className="mt-1 text-lg font-black">{activeWorkspace?.name}</p>
              <span className={cn('mt-2 inline-flex rounded-full px-2.5 py-1 text-[9px] font-black uppercase', isLive ? 'bg-amber-500/10 text-amber-600' : 'bg-sky-500/10 text-sky-600')}>{isLive ? 'Paystack test mode' : `${activeWorkspace?.mode} paper wallet`}</span>
            </div>
          </div>
        </header>

        {verifying ? <Notice icon={<LoaderCircle className="size-5 animate-spin" />} tone="info" text="Paystack returned your payment. Verifying status and amount securely…" /> : null}
        {success ? <Notice icon={<CheckCircle2 className="size-5" />} tone="success" text={success} /> : null}
        {error ? <Notice icon={<ShieldCheck className="size-5" />} tone="error" text={error} /> : null}

        <div className="mt-7 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="space-y-6">
            <CheckoutSection number="01" title="Choose fulfilment" description="Tracking behavior changes with your delivery choice.">
              <div className="grid gap-3 md:grid-cols-3">
                {deliveryOptions.map(option => {
                  const Icon = option.icon;
                  const selected = deliveryMethod === option.id;
                  return (
                    <button key={option.id} type="button" onClick={() => setDeliveryMethod(option.id)} className={cn('rounded-2xl border p-4 text-left transition', selected ? 'border-primary bg-primary/8 ring-2 ring-primary/10' : 'border-border/60 bg-background/50 hover:border-primary/30')}>
                      <span className={cn('grid size-10 place-items-center rounded-xl', selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}><Icon className="size-5" /></span>
                      <span className="mt-4 block text-sm font-black">{option.title}</span>
                      <span className="mt-1 block text-[11px] leading-5 text-muted-foreground">{option.description}</span>
                      <span className="mt-3 block text-xs font-black">{option.fee ? currency.format(option.fee) : 'No delivery fee'}</span>
                    </button>
                  );
                })}
              </div>
            </CheckoutSection>

            <CheckoutSection number="02" title={deliveryMethod === 'STORE_PICKUP' ? 'Pickup contact' : 'Delivery details'} description="Used for fulfilment and your delivery tracking record.">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Recipient name" value={recipientName} onChange={setRecipientName} autoComplete="name" />
                <Field label="Phone number" value={phone} onChange={setPhone} autoComplete="tel" />
                {deliveryMethod !== 'STORE_PICKUP' ? (
                  <>
                    <Field label="Address" value={addressLine1} onChange={setAddressLine1} autoComplete="street-address" className="sm:col-span-2" />
                    <Field label="Address line 2 (optional)" value={addressLine2} onChange={setAddressLine2} className="sm:col-span-2" />
                    <Field label="City" value={city} onChange={setCity} autoComplete="address-level2" />
                    <Field label="State" value={state} onChange={setState} autoComplete="address-level1" />
                  </>
                ) : null}
                <label className="sm:col-span-2"><span className="mb-2 block text-xs font-bold">Order note (optional)</span><textarea value={notes} onChange={event => setNotes(event.target.value)} rows={3} className="w-full resize-none rounded-xl border border-border/70 bg-background px-4 py-3 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/10" /></label>
              </div>
              {deliveryMethod !== 'STORE_PICKUP' ? <label className="mt-4 flex cursor-pointer items-center gap-3 text-xs text-muted-foreground"><input type="checkbox" checked={saveAddress} onChange={event => setSaveAddress(event.target.checked)} className="size-4 accent-primary" /> Save these delivery details to my account</label> : null}
            </CheckoutSection>

            <CheckoutSection number="03" title="Payment" description={isLive ? 'Paystack hosts the sensitive payment fields; Shelsea never receives your card number.' : 'Demo and Practice use safe paper money and never publish a live transaction.'}>
              <div className="flex items-center gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-500 text-white">{isLive ? <CreditCard className="size-6" /> : <Banknote className="size-6" />}</span>
                <div className="min-w-0 flex-1"><p className="text-sm font-black">{isLive ? 'Pay securely with Paystack' : `${activeWorkspace?.mode} paper wallet`}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{isLive ? 'Card, bank, USSD and bank transfer are offered in Paystack test mode.' : `${activeWorkspace?.wallet ? currency.format(activeWorkspace.wallet.balance) : 'Paper balance'} available in this experience.`}</p></div>
                <BadgeCheck className="size-5 shrink-0 text-emerald-600" />
              </div>
            </CheckoutSection>
          </div>

          <aside className="space-y-5 xl:sticky xl:top-24">
            <section className="rounded-[1.75rem] border border-border/60 bg-card p-5 shadow-xl">
              <p className="text-[10px] font-black uppercase tracking-[.16em] text-muted-foreground">Order summary</p>
              <div className="mt-4 space-y-3 border-b border-border/60 pb-4">
                {items.map(item => <div key={item.id} className="flex items-center justify-between gap-3 text-xs"><span className="min-w-0 truncate text-muted-foreground">{item.quantity} × {item.product.name}</span><span className="shrink-0 font-bold">{currency.format(item.variant.price * item.quantity)}</span></div>)}
              </div>
              <div className="mt-4 space-y-3 text-sm"><SummaryRow label="Products" value={currency.format(subtotal)} /><SummaryRow label={selectedDelivery.title} value={selectedDelivery.fee ? currency.format(selectedDelivery.fee) : 'Free'} /></div>
              <div className="my-5 border-t border-border/60" />
              <div className="flex items-end justify-between"><span className="font-black">Total</span><span className="text-3xl font-black tracking-tight">{currency.format(total)}</span></div>
              <button type="button" disabled={submitting || verifying || !items.length} onClick={() => void startCheckout()} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3.5 text-sm font-black text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">{submitting ? <LoaderCircle className="size-4 animate-spin" /> : <LockKeyhole className="size-4" />}{submitting ? 'Starting secure payment…' : items.length ? (isLive ? 'Continue to Paystack' : 'Pay with paper wallet') : 'Your cart is empty'}</button>
              <p className="mt-3 text-center text-[10px] leading-4 text-muted-foreground">The total is recalculated from live inventory on the server before payment begins.</p>
            </section>

            <section className="rounded-[1.75rem] border border-border/60 bg-card p-5">
              <div className="flex items-center justify-between"><div><p className="text-xs font-black">Recent payments</p><p className="mt-1 text-[10px] text-muted-foreground">Current workspace</p></div>{historyLoading ? <LoaderCircle className="size-4 animate-spin text-muted-foreground" /> : <CreditCard className="size-4 text-primary" />}</div>
              <div className="mt-4 space-y-2">
                {history.slice(0, 5).map(payment => <article key={payment.id} className="rounded-xl bg-muted/45 p-3"><div className="flex items-center justify-between gap-2"><p className="truncate text-[11px] font-black">{payment.order.orderNumber}</p><span className={cn('rounded-full px-2 py-1 text-[8px] font-black', payment.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-600' : payment.status === 'FAILED' ? 'bg-red-500/10 text-red-600' : 'bg-amber-500/10 text-amber-600')}>{payment.status}</span></div><div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground"><span>{new Date(payment.createdAt).toLocaleDateString('en-NG')}</span><span className="font-bold text-foreground">{currency.format(payment.amount)}</span></div></article>)}
                {!historyLoading && !history.length ? <p className="rounded-xl border border-dashed border-border/70 p-4 text-center text-[10px] leading-4 text-muted-foreground">Completed and attempted payments will appear here.</p> : null}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function CheckoutSection({ number, title, description, children }: { number: string; title: string; description: string; children: React.ReactNode }) {
  return <section className="rounded-[1.75rem] border border-border/60 bg-card p-5 shadow-sm sm:p-7"><header className="mb-5 flex gap-4"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-foreground text-[10px] font-black text-background">{number}</span><div><h2 className="text-lg font-black">{title}</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p></div></header>{children}</section>;
}

function Field({ label, value, onChange, autoComplete, className }: { label: string; value: string; onChange: (value: string) => void; autoComplete?: string; className?: string }) {
  return <label className={className}><span className="mb-2 block text-xs font-bold">{label}</span><input value={value} onChange={event => onChange(event.target.value)} autoComplete={autoComplete} className="h-12 w-full rounded-xl border border-border/70 bg-background px-4 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/10" /></label>;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">{label}</span><span className="font-bold">{value}</span></div>;
}

function Notice({ icon, text, tone }: { icon: React.ReactNode; text: string; tone: 'info' | 'success' | 'error' }) {
  return <div role={tone === 'error' ? 'alert' : 'status'} className={cn('mt-5 flex items-center gap-3 rounded-2xl border p-4 text-sm font-semibold', tone === 'success' && 'border-emerald-500/25 bg-emerald-500/8 text-emerald-700 dark:text-emerald-300', tone === 'error' && 'border-red-500/25 bg-red-500/8 text-red-700 dark:text-red-300', tone === 'info' && 'border-sky-500/25 bg-sky-500/8 text-sky-700 dark:text-sky-300')}>{icon}<span>{text}</span></div>;
}
