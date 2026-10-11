import { Skeleton, SkeletonPage } from "@/components/admin/ui";

export default function LeadLoading() {
  return (
    <SkeletonPage>
      <div className="flex gap-2">
        <Skeleton className="h-11 w-28 rounded-full" />
        <Skeleton className="h-11 w-28 rounded-full" />
        <Skeleton className="h-11 w-40 rounded-full" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    </SkeletonPage>
  );
}
