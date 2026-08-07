'use client';

import { useEffect } from 'react';

const SERVICE_WORKER_PATH = '/sw.js';

export default function PWARegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    if (process.env.NODE_ENV !== 'production') {
      void navigator.serviceWorker
        .getRegistrations()
        .then(registrations => {
          registrations.forEach(registration => {
            void registration.unregister();
          });
        })
        .catch(() => undefined);

      return;
    }

    const register = async () => {
      try {
        await navigator.serviceWorker.register(SERVICE_WORKER_PATH, {
          scope: '/',
          updateViaCache: 'none'
        });
      } catch (error) {
        console.warn('Shelsea PWA registration failed.', error);
      }
    };

    if (document.readyState === 'complete') {
      void register();
      return;
    }

    window.addEventListener('load', register, { once: true });

    return () => {
      window.removeEventListener('load', register);
    };
  }, []);

  return null;
}
