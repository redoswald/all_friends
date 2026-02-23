import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function EventsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>

      <div className="space-y-8">
        {Array.from({ length: 2 }).map((_, groupIdx) => (
          <div key={groupIdx}>
            <Skeleton className="h-4 w-32 mb-3" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-8 w-8 rounded-full mt-1" />
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-5 w-16 rounded-full" />
                        </div>
                        <Skeleton className="h-3 w-24" />
                        <div className="flex gap-1">
                          <Skeleton className="h-5 w-20 rounded-full" />
                          <Skeleton className="h-5 w-20 rounded-full" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
