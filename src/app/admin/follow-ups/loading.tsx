import { Skeleton, SkeletonPage } from "@/components/admin/ui";

export default function FollowUpsLoading() {
  return (
    <SkeletonPage>
      <Skeleton className="h-6 w-32" />
      <div className="space-y-4">
        <Skeleton className="h-36 rounded-xl" />
        <Skeleton className="h-36 rounded-xl" />
        <Skeleton className="h-36 rounded-xl" />
        <Skeleton className="h-36 rounded-xl" />
      </div>
    </SkeletonPage>
  );
}
