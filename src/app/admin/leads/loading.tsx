import { Skeleton, SkeletonPage } from "@/components/admin/ui";

export default function LeadsLoading() {
  return (
    <SkeletonPage>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Skeleton className="h-11 rounded-full sm:w-80" />
        <Skeleton className="h-11 rounded-full sm:ml-auto sm:w-40" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-9 w-20 rounded-full" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-24 rounded-xl" />
        ))}
      </div>
    </SkeletonPage>
  );
}
