'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'waffi:following-shops';
const CHANGE_EVENT = 'waffi:following-shops-change';

function readFollowing(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(value) ? value.filter((slug): slug is string => typeof slug === 'string') : [];
  } catch {
    return [];
  }
}

export function useFollowingShops() {
  const [following, setFollowing] = useState<string[]>([]);

  useEffect(() => {
    const sync = () => setFollowing(readFollowing());
    sync();
    window.addEventListener('storage', sync);
    window.addEventListener(CHANGE_EVENT, sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(CHANGE_EVENT, sync);
    };
  }, []);

  const toggle = (slug: string) => {
    const current = readFollowing();
    const next = current.includes(slug) ? current.filter(item => item !== slug) : [...current, slug];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  };

  return { following, toggle };
}
