export default function Loading() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header Skeleton */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="w-32 h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="flex-1 max-w-2xl h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
            <div className="w-32 h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
      </header>

      {/* Content Skeleton */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Main content */}
          <main className="flex-1 max-w-3xl">
            {/* Breadcrumbs skeleton */}
            <div className="flex items-center gap-2 text-sm mb-4">
              <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>

            {/* Post skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              {/* Title */}
              <div className="h-8 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
              
              {/* Author info */}
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>

              {/* Media placeholder */}
              <div className="w-full h-[600px] bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mb-6" />

              {/* Actions */}
              <div className="flex gap-4 mb-4">
                <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
              </div>
            </div>
          </main>

          {/* Sidebar skeleton */}
          <aside className="hidden lg:block w-80 space-y-4">
            {/* Community info skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                <div className="flex-1">
                  <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              </div>
              <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
            </div>

            {/* Related posts skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse flex-shrink-0" />
                    <div className="flex-1">
                      <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
                      <div className="h-3 w-2/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

