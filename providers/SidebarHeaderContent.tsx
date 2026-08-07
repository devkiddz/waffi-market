import {
  PanelLeftClose
} from 'lucide-react';

import LogoComponent from '@/components/shared/LogoComponent';

import {
  Button
} from '@/components/ui/button';

import {
  useSidebar
} from '@/components/ui/sidebar';

export default function SidebarHeaderContent() {
  const {
    isMobile,
    setOpen,
    setOpenMobile
  } =
    useSidebar();

  return (
    <div
      className="
        relative flex
        items-center
        justify-between
        gap-3 px-1
        py-2.5
      ">
      <div className="min-w-0">
        <LogoComponent
          brandName="Shelsea"
          brandSlug=""
        />

        <p
          className="
            mt-0.5 pl-1
            text-[0.66rem]
            font-medium
            tracking-[0.02em]
            text-muted-foreground
          ">
          Fashion • Beauty • Lifestyle
        </p>
      </div>

      <Button
        type="button"
        aria-label="Close sidebar"
        onClick={() => {
          if (isMobile) {
            setOpenMobile(
              false
            );
          } else {
            setOpen(
              false
            );
          }
        }}
        className="
          rounded-md
          bg-card/10 p-2
          transition
          hover:bg-transparent
          md:hidden
        ">
        <PanelLeftClose className="size-5 text-primary" />
      </Button>
    </div>
  );
}
