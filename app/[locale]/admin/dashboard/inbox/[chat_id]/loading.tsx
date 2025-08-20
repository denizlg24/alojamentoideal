import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <div className="w-full flex flex-col gap-4 items-start">
      <div className="grid lg:grid-cols-5 md:grid-cols-4 sm:grid-cols-3 grid-cols-2 w-full">
        <div className="h-screen overflow-y-auto col-span-1 border-r shadow flex flex-col gap-1">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    </div>
  );
}
