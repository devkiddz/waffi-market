import { redirect } from 'next/navigation';

type LegacyStoreParams = Record<string, string | string[] | undefined>;

/** Keep existing bookmarked Store links working while the homepage becomes the main entry. */
export default async function LegacyStorePage({ searchParams }: { searchParams: Promise<LegacyStoreParams> }) {
  const input = await searchParams;
  const first = (key: string) => {
    const value = input[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const category = first('category');
  if (first('shoppingList') || first('product') || first('collection') || first('promotion') || first('q') || first('query')) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(input)) {
      if (Array.isArray(value)) value.forEach(item => params.append(key, item));
      else if (value !== undefined) params.set(key, value);
    }
    redirect(`/discover?${params}`);
  }
  if (category && category !== 'all') redirect(`/categories/${encodeURIComponent(category)}`);
  if (first('view') === 'grid') redirect('/categories/all');
  redirect('/');
}
