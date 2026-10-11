import { Skeleton, SkeletonPage } from "@/components/admin/ui";

export default function AdminLoading() {
  return (
    <SkeletonPage>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
      <Skeleton className="h-28 rounded-xl" />
    </SkeletonPage>
  );
}
