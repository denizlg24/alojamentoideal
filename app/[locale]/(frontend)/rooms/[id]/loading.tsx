import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="flex flex-col items-center w-full mx-auto md:gap-0 gap-2 mb-16">
      <div className="w-full max-w-7xl px-4 flex flex-col gap-6 mt-6">
        <div className="md:grid hidden grid-cols-4 w-full rounded-2xl overflow-hidden gap-2">
          <div className="col-span-2 w-full h-auto aspect-[2/1.5] relative">
            <Skeleton className="w-full h-full" />
          </div>
          <div className="col-span-1 w-full h-full flex flex-col relative gap-2">
            <Skeleton className="w-full h-auto aspect-[2/1.5]" />
            <Skeleton className="w-full h-auto aspect-[2/1.5]" />
          </div>
          <div className="col-span-1 w-full h-full flex flex-col relative gap-2">
            <Skeleton className="w-full h-auto aspect-[2/1.5]" />
            <Skeleton className="w-full h-auto aspect-[2/1.5]" />
          </div>
        </div>
        <div className="w-full md:hidden">
          <Skeleton className="w-full h-auto aspect-video rounded-2xl" />
        </div>
        <div className="w-full lg:grid grid-cols-5 flex flex-col-reverse gap-8">
          <div className="flex flex-col gap-6 col-span-3">
            <div className="w-full flex flex-col gap-1">
              <Skeleton className="w-[55%] h-6" />
              <Skeleton className="w-[45%] h-4" />
              <Skeleton className="w-24 h-4" />
            </div>
            <div className="w-full grid grid-cols-2 overflow-hidden gap-4">
              <Skeleton className="col-span-1 w-full h-6 max-w-28 mx-auto" />
              <Skeleton className="col-span-1 w-full h-6 max-w-28 mx-auto" />
              <Skeleton className="col-span-full w-full h-[1px]" />
              <div className="flex flex-row items-center justify-start w-full gap-4 flex-wrap col-span-full">
                <Skeleton className="w-full h-6 max-w-28" />
                <Skeleton className="w-full h-6 max-w-28" />
                <Skeleton className="w-full h-6 max-w-28" />
                <Skeleton className="w-full h-6 max-w-28" />
              </div>
              <div className="w-full col-span-2 flex flex-col gap-1">
                <Skeleton className="w-full h-4" />
                <Skeleton className="w-full h-4" />
                <Skeleton className="w-full h-4" />
                <Skeleton className="w-full h-4" />
                <Skeleton className="w-full h-4" />
                <Skeleton className="w-[70%] h-4" />
                <Skeleton className="w-[1px] h-4 bg-transparent" />
                <Skeleton className="w-full h-4" />
                <Skeleton className="w-[70%] h-4" />
              </div>
              <Skeleton className="col-span-2 w-full h-4 mt-2" />
            </div>
          </div>
          <div className="w-full col-span-2">
            <Skeleton className="w-full aspect-[4/3] h-auto" />
          </div>
        </div>
      </div>
    </main>
  );
}
