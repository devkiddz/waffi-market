import { AlertTriangle, Boxes, PackageCheck, Warehouse } from 'lucide-react';

/* SHELSEA_INVENTORY_VARIANT_COLOR_LABEL_V1 */

import { getAdminAccess } from '@/features/admin/auth/adminPermissions';
import { AdminMetric, AdminPage, AdminPageHeader } from '@/features/admin/components';
import { adjustInventory } from '@/features/admin/inventory/actions';
import { prisma } from '@/lib/prisma';

export default async function AdminInventoryPage() {
  const access = await getAdminAccess();
  if (!access.permissions.has('inventory:view')) throw new Error('Inventory access is required.');

  const variants = await prisma.productVariant.findMany({
    where: { product: { workspaceId: access.membership.workspaceId } },
    include: { product: { select: { name: true, status: true, images: { orderBy: { position: 'asc' }, take: 1, select: { url: true } } } }, inventory: true },
    orderBy: [{ product: { name: 'asc' } }, { position: 'asc' }]
  });
  const total = variants.reduce((sum, item) => sum + (item.inventory?.quantity ?? 0), 0);
  const reserved = variants.reduce((sum, item) => sum + (item.inventory?.reserved ?? 0), 0);
  const low = variants.filter(item => (item.inventory?.quantity ?? 0) - (item.inventory?.reserved ?? 0) <= (item.inventory?.reorderLevel ?? access.membership.workspace.defaultLowStockLevel)).length;
  const out = variants.filter(item => (item.inventory?.quantity ?? 0) - (item.inventory?.reserved ?? 0) <= 0).length;

  return <AdminPage><div className="mx-auto max-w-[96rem] space-y-5">
    <AdminPageHeader eyebrow="Commerce operations" title="Inventory Management" description="Review available and reserved stock, detect reorder risks and record auditable stock adjustments." />
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><AdminMetric icon={Warehouse} label="Total stock" value={total} /><AdminMetric icon={PackageCheck} label="Reserved" value={reserved} /><AdminMetric icon={AlertTriangle} label="Low stock variants" value={low} /><AdminMetric icon={Boxes} label="Out of stock" value={out} /></section>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{variants.map(variant => { const quantity=variant.inventory?.quantity ?? 0; const itemReserved=variant.inventory?.reserved ?? 0; const available=Math.max(quantity-itemReserved,0); const reorder=variant.inventory?.reorderLevel ?? access.membership.workspace.defaultLowStockLevel; const lowStock=available<=reorder; return <article key={variant.id} className="rounded-[2rem] border border-border/60 bg-card/75 p-5 shadow-sm"><div className="flex gap-3">{variant.product.images[0]?.url ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={variant.product.images[0].url} alt="" className="size-14 rounded-2xl object-cover" /> : <span className="grid size-14 place-items-center rounded-2xl bg-muted"><Boxes className="size-5" /></span>}<div className="min-w-0 flex-1"><h2 className="truncate text-sm font-black">{variant.product.name}</h2><p className="mt-1 truncate text-[10px] text-muted-foreground">{variant.label}{variant.color ? ` · ${variant.color}` : ''} · {variant.sku ?? 'No SKU'}</p><span className={lowStock ? 'mt-2 inline-flex rounded-full bg-amber-500/10 px-2 py-1 text-[8px] font-bold text-amber-600' : 'mt-2 inline-flex rounded-full bg-emerald-500/10 px-2 py-1 text-[8px] font-bold text-emerald-600'}>{lowStock ? 'REORDER' : 'HEALTHY'}</span></div></div><div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-muted/40 p-3 text-center"><Stat label="Quantity" value={quantity} /><Stat label="Reserved" value={itemReserved} /><Stat label="Available" value={available} /></div>{access.permissions.has('inventory:manage') ? <form action={adjustInventory} className="mt-4 grid grid-cols-[1fr_5rem] gap-2"><input type="hidden" name="variantId" value={variant.id} /><select name="operation" className={fieldClass}><option value="ADD">Add</option><option value="REMOVE">Remove</option><option value="SET">Set total</option></select><input name="amount" type="number" min="0" required className={fieldClass} /><input name="reason" placeholder="Adjustment reason" className={fieldClass+' col-span-2'} /><button className="col-span-2 h-10 rounded-full bg-foreground text-[10px] font-bold text-background">Record stock adjustment</button></form> : null}</article>; })}</section>
  </div></AdminPage>;
}
const fieldClass='h-10 min-w-0 rounded-xl border border-border/70 bg-background px-3 text-xs outline-none focus:border-primary';
function Stat({label,value}:{label:string;value:number}){return <div><p className="text-lg font-black">{value}</p><p className="text-[8px] text-muted-foreground">{label}</p></div>;}
