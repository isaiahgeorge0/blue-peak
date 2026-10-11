import { Skeleton, SkeletonPage } from "@/components/admin/ui";

export default function CalendarLoading() {
  return (
    <SkeletonPage>
      <div className="flex items-center gap-2">
        <Skeleton className="size-11 rounded-full" />
        <Skeleton className="size-11 rounded-full" />
        <Skeleton className="ml-2 h-7 w-44" />
      </div>
      <Skeleton className="h-[28rem] rounded-xl" />
    </SkeletonPage>
  );
}
