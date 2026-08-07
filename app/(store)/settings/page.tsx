'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Check, ChevronRight, LoaderCircle, Plus, Save, Settings2, Sparkles, Trash2 } from 'lucide-react';

import StoreLoadingState from '@/components/loading/StoreLoadingState';
import { useActionFeedback } from '@/features/action-feedback';
import { useCatalog } from '@/features/catalog';
import { cn } from '@/lib/utils';

type ShoppingList = { id: string; name: string; productIds: string[] };
type SettingsState = { name: string; email: string; image: string; shoppingLists: ShoppingList[]; experienceDensity: string; recommendationMode: string; preferredCategorySlugs: string[]; autoplayPreviews: boolean; discoveryEnabled: boolean; shoppingNotifications: boolean; personalizationEnabled: boolean };

export default function SettingsPage() {
  const { success, error: notifyError } = useActionFeedback();
  const { categories, products } = useCatalog();
  const [settings, setSettings] = useState<SettingsState | null>(null);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [newListName, setNewListName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { void fetch('/api/account/experience-settings').then(response => response.json()).then(data => { const next = { ...data.profile, ...data.user } as SettingsState; setSettings(next); setActiveListId(next.shoppingLists[0]?.id ?? null); }); }, []);
  const activeList = useMemo(() => settings?.shoppingLists.find(list => list.id === activeListId) ?? null, [activeListId, settings]);
  if (!settings) return <StoreLoadingState label="Loading experience settings" />;

  const update = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => { setSaved(false); setSettings(current => current ? { ...current, [key]: value } : current); };
  const save = async () => {
    setSaving(true);
    setSaved(false);

    try {
      const response = await fetch('/api/account/experience-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || 'Your experience settings could not be saved.');
      }

      setSaved(true);
      success({
        title: 'Experience saved',
        description: 'Your Shelsea preferences are now up to date.',
        groupKey: 'account:experience-settings'
      });
    } catch (saveError) {
      notifyError({
        title: 'Save unsuccessful',
        description:
          saveError instanceof Error
            ? saveError.message
            : 'Your experience settings could not be saved.',
        groupKey: 'account:experience-settings'
      });
    } finally {
      setSaving(false);
    }
  };
  const createList = () => { const name = newListName.trim(); if (!name) return; const list = { id: crypto.randomUUID(), name, productIds: [] }; update('shoppingLists', [...settings.shoppingLists, list]); setActiveListId(list.id); setNewListName(''); };
  const updateActiveList = (next: ShoppingList) => update('shoppingLists', settings.shoppingLists.map(list => list.id === next.id ? next : list));

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      <Link href="/account" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground"><ArrowLeft className="size-4" /> Account dashboard</Link>
      <header className="mt-5 rounded-[2rem] border border-border/60 bg-card p-6 shadow-xl sm:p-9"><div className="grid size-13 place-items-center rounded-2xl bg-primary/10 text-primary"><Settings2 className="size-6" /></div><p className="mt-5 text-xs font-black uppercase tracking-[.18em] text-primary">Personal experience</p><h1 className="mt-2 text-3xl font-black sm:text-5xl">Make Shelsea yours</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Control your identity, recommendation behavior, discovery rhythm, and playlist-style shopping collections.</p></header>

      <div className="mt-6 grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
        <div className="space-y-5">
          <SettingsCard title="Profile details" description="Shown across your account and shopping activity."><Field label="Display name"><input value={settings.name} onChange={event => update('name', event.target.value)} className={inputClass} /></Field><Field label="Email"><input value={settings.email} disabled className={cn(inputClass, 'opacity-60')} /></Field><Field label="Profile image URL"><input value={settings.image} onChange={event => update('image', event.target.value)} placeholder="https://…" className={inputClass} /></Field></SettingsCard>
          <SettingsCard title="Experience behavior" description="Choose how the app builds and presents your store."><Choice label="Display density" value={settings.experienceDensity} options={['compact', 'balanced', 'immersive']} onChange={value => update('experienceDensity', value)} /><Choice label="Recommendation style" value={settings.recommendationMode} options={['familiar', 'balanced', 'exploratory']} onChange={value => update('recommendationMode', value)} /><Toggle label="Personalized recommendations" checked={settings.personalizationEnabled} onChange={value => update('personalizationEnabled', value)} /><Toggle label="Autoplay featured previews" checked={settings.autoplayPreviews} onChange={value => update('autoplayPreviews', value)} /><Toggle label="Discovery Hub" checked={settings.discoveryEnabled} onChange={value => update('discoveryEnabled', value)} /><Toggle label="Shopping notifications" checked={settings.shoppingNotifications} onChange={value => update('shoppingNotifications', value)} /></SettingsCard>
        </div>

        <div className="space-y-5">
          <SettingsCard title="Shopping playlists" description="Build collections for occasions, routines, gifting, or your next checkout."><div className="flex gap-2"><input value={newListName} onChange={event => setNewListName(event.target.value)} onKeyDown={event => event.key === 'Enter' && createList()} placeholder="e.g. Friday night essentials" className={inputClass} /><button type="button" onClick={createList} className="grid size-11 shrink-0 place-items-center rounded-xl bg-foreground text-background"><Plus className="size-4" /></button></div><div className="mt-4 flex snap-x gap-2 overflow-x-auto pb-2 scrollbar-none">{settings.shoppingLists.map(list => <button key={list.id} type="button" onClick={() => setActiveListId(list.id)} className={cn('shrink-0 rounded-full border px-4 py-2 text-xs font-bold', list.id === activeListId ? 'border-foreground bg-foreground text-background' : 'border-border')}>{list.name} · {list.productIds.length}</button>)}</div>{activeList ? <div className="mt-4"><div className="flex items-center justify-between"><h3 className="text-sm font-black">Add products to {activeList.name}</h3><button type="button" onClick={() => { update('shoppingLists', settings.shoppingLists.filter(list => list.id !== activeList.id)); setActiveListId(null); }} className="text-destructive"><Trash2 className="size-4" /></button></div><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">{products.slice(0, 18).map(product => { const selected = activeList.productIds.includes(product.id); const variant = product.variants[0]; return <button key={product.id} type="button" onClick={() => updateActiveList({ ...activeList, productIds: selected ? activeList.productIds.filter(id => id !== product.id) : [...activeList.productIds, product.id] })} className={cn('relative overflow-hidden rounded-2xl border p-2 text-left transition', selected ? 'border-primary ring-2 ring-primary/15' : 'border-border/60')}><div className="relative aspect-square overflow-hidden rounded-xl bg-muted">{variant ? <Image src={variant.image} alt={product.name} fill sizes="140px" className="object-cover" /> : null}{selected ? <span className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="size-3.5" /></span> : null}</div><p className="mt-2 truncate text-[10px] font-bold">{product.name}</p></button>; })}</div></div> : <div className="mt-5 rounded-2xl border border-dashed p-6 text-center text-xs text-muted-foreground">Create a shopping playlist to begin.</div>}</SettingsCard>
          <SettingsCard title="Favorite departments" description="These become stronger signals in your dashboard and store rails."><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{categories.filter(category => category.slug !== 'all').map(category => { const selected = settings.preferredCategorySlugs.includes(category.slug); return <button key={category.id} type="button" onClick={() => update('preferredCategorySlugs', selected ? settings.preferredCategorySlugs.filter(slug => slug !== category.slug) : [...settings.preferredCategorySlugs, category.slug])} className={cn('flex items-center justify-between rounded-2xl border px-3 py-3 text-left text-xs font-bold', selected ? 'border-primary bg-primary/10 text-primary' : 'border-border/60')}><span className="truncate">{category.label}</span>{selected ? <Check className="size-3.5" /> : <ChevronRight className="size-3.5 text-muted-foreground" />}</button>; })}</div></SettingsCard>
        </div>
      </div>
      <div className="sticky bottom-24 z-20 mt-6 flex justify-end lg:bottom-4"><button type="button" disabled={saving} onClick={() => void save()} className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-sm font-black text-primary-foreground shadow-xl disabled:opacity-60">{saving ? <LoaderCircle className="size-4 animate-spin" /> : saved ? <Check className="size-4" /> : <Save className="size-4" />}{saving ? 'Saving…' : saved ? 'Experience saved' : 'Save experience'}</button></div>
    </main>
  );
}

const inputClass = 'h-11 min-w-0 w-full rounded-xl border border-border/70 bg-background px-3 text-sm outline-none focus:border-primary';
function SettingsCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) { return <section className="rounded-[2rem] border border-border/60 bg-card p-5 shadow-lg sm:p-6"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><Sparkles className="size-4" /></span><div><h2 className="text-lg font-black">{title}</h2><p className="mt-1 text-[10px] leading-4 text-muted-foreground">{description}</p></div></div><div className="mt-5 space-y-4">{children}</div></section>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-xs font-bold">{label}</span>{children}</label>; }
function Choice({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) { return <div><p className="mb-2 text-xs font-bold">{label}</p><div className="grid grid-cols-3 gap-2">{options.map(option => <button key={option} type="button" onClick={() => onChange(option)} className={cn('rounded-xl border px-2 py-2 text-[10px] font-bold capitalize', value === option ? 'border-primary bg-primary/10 text-primary' : 'border-border/60')}>{option}</button>)}</div></div>; }
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) { return <button type="button" onClick={() => onChange(!checked)} className="flex w-full items-center justify-between gap-4 rounded-xl bg-muted/40 px-3 py-3 text-left text-xs font-bold"><span>{label}</span><span className={cn('relative h-6 w-11 rounded-full transition', checked ? 'bg-primary' : 'bg-muted')}><span className={cn('absolute top-1 size-4 rounded-full bg-white transition', checked ? 'left-6' : 'left-1')} /></span></button>; }
