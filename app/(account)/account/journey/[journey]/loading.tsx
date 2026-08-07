import {
  LoaderCircle
} from 'lucide-react';

export default function CustomerJourneyLoading() {
  return (
    <main
      className="
        grid min-h-[70dvh]
        place-items-center
        bg-muted/20 px-6
      ">
      <div className="text-center">
        <LoaderCircle
          className="
            mx-auto size-7
            animate-spin text-primary
          "
        />

        <p className="mt-3 text-sm font-bold">
          Preparing your journey…
        </p>

        <p
          className="
            mt-1 text-xs
            text-muted-foreground
          ">
          Shelsea is resolving the complete
          workspace record.
        </p>
      </div>
    </main>
  );
}
