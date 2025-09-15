import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="flex flex-col items-center w-full mx-auto md:gap-0 gap-2 mb-16">
      <div className="w-full max-w-7xl mx-auto flex flex-col gap-8 px-4 pt-12">
        <Skeleton className="w-full h-[70px]" />
        <Skeleton className="w-full h-[300px]" />{" "}
      </div>
    </main>
  );
}
