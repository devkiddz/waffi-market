import {
  Suspense
} from 'react';

import MainSectionGrid from './MainSectionGrid';

const LIGHT_BACKGROUND =
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=85&w=2000&auto=format&fit=crop';

const DARK_BACKGROUND =
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=85&w=2000&auto=format&fit=crop';

export default function HeroComponent() {
  return (
    <section className="relative flex w-full overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-500 dark:opacity-0"
        style={{
          backgroundImage:
            `url("${LIGHT_BACKGROUND}")`
        }}
      />

      <div
        className="absolute inset-0 bg-cover bg-center opacity-0 transition-all duration-500 dark:opacity-100"
        style={{
          backgroundImage:
            `url("${DARK_BACKGROUND}")`
        }}
      />

      <div className="absolute inset-0 bg-black/35 dark:bg-black/60" />

      <div className="relative flex w-full flex-col items-center justify-center">
        <Suspense
          fallback={
            <div>Loading...</div>
          }>
          <MainSectionGrid />
        </Suspense>
      </div>
    </section>
  );
}
