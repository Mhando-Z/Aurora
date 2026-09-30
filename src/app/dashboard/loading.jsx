export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="flex min-h-screen">
        {/* Sidebar skeleton */}
        <aside className="hidden w-64 border-r border-gray-200 p-4 lg:block">
          <div className="mb-8 h-10 w-32 animate-pulse rounded-xl bg-gray-200" />

          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-10 w-full animate-pulse rounded-xl bg-gray-100"
              />
            ))}
          </div>

          <div className="mt-auto pt-10">
            <div className="h-14 w-full animate-pulse rounded-xl bg-gray-100" />
          </div>
        </aside>

        {/* Main dashboard */}
        <main className="flex-1">
          {/* Header */}
          <header className="flex h-16 items-center justify-between border-b border-gray-200 px-4 md:px-6">
            <div className="h-8 w-36 animate-pulse rounded-lg bg-gray-200" />

            <div className="flex items-center gap-3">
              <div className="hidden h-8 w-28 animate-pulse rounded-lg bg-gray-100 sm:block" />

              <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
            </div>
          </header>

          {/* Content */}
          <div className="p-4 md:p-6">
            {/* Page heading */}
            <div className="mb-8">
              <div className="mb-3 h-8 w-52 animate-pulse rounded-lg bg-gray-200" />

              <div className="h-4 w-80 max-w-full animate-pulse rounded bg-gray-100" />
            </div>

            {/* Stats */}
            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-gray-200 p-5"
                >
                  <div className="mb-6 flex items-center justify-between">
                    <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />

                    <div className="h-9 w-9 animate-pulse rounded-xl bg-gray-100" />
                  </div>

                  <div className="mb-2 h-7 w-20 animate-pulse rounded bg-gray-200" />

                  <div className="h-3 w-28 animate-pulse rounded bg-gray-100" />
                </div>
              ))}
            </div>

            {/* Main cards */}
            <div className="grid gap-6 xl:grid-cols-3">
              <div className="rounded-2xl border border-gray-200 p-5 xl:col-span-2">
                <div className="mb-6 flex items-center justify-between">
                  <div className="h-6 w-40 animate-pulse rounded bg-gray-200" />

                  <div className="h-8 w-20 animate-pulse rounded-lg bg-gray-100" />
                </div>

                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between border-b border-gray-100 pb-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 animate-pulse rounded-xl bg-gray-100" />

                        <div className="space-y-2">
                          <div className="h-4 w-36 animate-pulse rounded bg-gray-200" />
                          <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
                        </div>
                      </div>

                      <div className="h-6 w-16 animate-pulse rounded-full bg-gray-100" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 p-5">
                <div className="mb-6 h-6 w-32 animate-pulse rounded bg-gray-200" />

                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-16 w-full animate-pulse rounded-xl bg-gray-100"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
