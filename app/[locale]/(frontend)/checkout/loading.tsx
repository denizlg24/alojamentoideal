import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="flex flex-col items-center w-full mx-auto md:gap-0 gap-2 mb-16">
       <div className="lg:grid flex flex-col-reverse grid-cols-5 w-full max-w-7xl px-4 pt-12 gap-8 relative lg:items-start items-center">
        <Skeleton className="col-span-3 w-full h-[60vh]"/>
        <Skeleton className="col-span-2 w-full h-[60vh]"/>
       </div>
    </main>
  );
}
