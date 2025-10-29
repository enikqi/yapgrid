import { Skeleton } from '@/components/ui/skeleton'

export function VideoCardSkeleton() {
  const aspectRatio = 9 / 16 // Default aspect ratio for skeleton

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm overflow-hidden">
      {/* Thumbnail skeleton */}
      <div className="relative" style={{ aspectRatio }}>
        <Skeleton className="absolute inset-0" />
      </div>

      {/* Content skeleton */}
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
          <div className="flex items-center gap-1">
            <Skeleton className="h-6 w-6 rounded" />
            <Skeleton className="h-6 w-6 rounded" />
            <Skeleton className="h-6 w-6 rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}
