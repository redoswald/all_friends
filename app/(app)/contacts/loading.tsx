import { Skeleton } from "@/components/ui/skeleton";

export default function ContactsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>

      <div className="hidden md:block border rounded-lg">
        <div className="border-b px-4 py-3 flex gap-4">
          {["w-[40px]", "w-[250px]", "w-24", "w-24", "w-20", "w-20", "w-20"].map((w, i) => (
            <Skeleton key={i} className={`h-4 ${w}`} />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b last:border-0">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-16 rounded-full ml-auto" />
          </div>
        ))}
      </div>

      <div className="md:hidden space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-3 bg-white">
            <div className="flex items-start gap-3">
              <Skeleton className="h-4 w-4 mt-1" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
