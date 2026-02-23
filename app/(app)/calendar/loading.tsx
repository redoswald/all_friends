import { Skeleton } from "@/components/ui/skeleton";

export default function CalendarLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-28" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
      </div>

      <div className="border rounded-lg">
        <div className="grid grid-cols-7 border-b">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="p-3 text-center">
              <Skeleton className="h-4 w-8 mx-auto" />
            </div>
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, row) => (
          <div key={row} className="grid grid-cols-7 border-b last:border-0">
            {Array.from({ length: 7 }).map((_, col) => (
              <div key={col} className="min-h-[100px] p-2 border-r last:border-0">
                <Skeleton className="h-6 w-6 rounded-full mb-2" />
                {(row + col) % 3 === 0 && <Skeleton className="h-4 w-full rounded" />}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
