import { FloatingFilter } from "@/components/home/floating-filter";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return <ListingsSkeleton />;
}

export const ListingsSkeleton = () => {
  return (
    <main className="flex flex-col items-center w-full mx-auto md:gap-0 gap-2 mb-16 px-4">
      <div className="w-full fixed z-85 bg-background h-fit p-4 shadow">
        <FloatingFilter className="max-w-7xl" />
      </div>
      <div className="w-full max-w-7xl md:mt-30 sm:mt-40 mt-52">
        <div className="grid grid-cols-3 items-start w-full gap-6">
          <div className="grid xl:grid-cols-3 min-[500px]:grid-cols-2 grid-cols-1 gap-4 md:col-span-2 col-span-3">
            <div className="flex flex-col col-span-full w-full gap-1">
              <Skeleton className="col-span-full w-[50%] h-7" />
              <Skeleton className="col-span-full w-[35%] h-5" />
            </div>
            {Array.from({ length: 24 }, (v, i) => i).map((i) => {
              return (
                <Card
                  key={i}
                  className="w-full max-w-sm mx-auto flex flex-col items-center gap-0 relative p-0"
                >
                  <Skeleton className="w-full h-auto aspect-[4/2] rounded-t-xl" />
                  <CardContent className="flex flex-col w-full p-2 mt-auto gap-1">
                    <Skeleton className="w-[90%] h-6" />
                    <Skeleton className="w-[80%] h-5" />
                    <div className="flex flex-row items-center justify-between w-full font-sans">
                      <div className="flex flex-row items-center justify-start gap-2">
                        <Skeleton className="w-[15%] h-4" />
                      </div>
                      <div className="">
                        <Skeleton className="w-[20%] h-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <div className="col-span-full w-full md:hidden flex flex-row items-start h-[300px] rounded-xl shadow overflow-hidden">
            <Skeleton className="w-full h-full" />
          </div>
          <div className="col-span-1 w-full sticky top-44 md:flex hidden flex-row items-start h-[calc(100vh-64px-70px-48px-72px)] mt-16 rounded-xl shadow overflow-hidden">
            <Skeleton className="w-full h-full" />
          </div>
        </div>
      </div>
    </main>
  );
};
