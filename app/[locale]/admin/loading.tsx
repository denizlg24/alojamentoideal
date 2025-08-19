import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <div className="w-full flex flex-col gap-4 items-start mt-4">
      <Skeleton className="w-[230px] h-[130px]" />
      <Skeleton className="w-full h-[670px]" />
    </div>
  );
}
