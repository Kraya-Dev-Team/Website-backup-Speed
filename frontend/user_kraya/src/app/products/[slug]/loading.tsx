export function ProductSkeleton() {
  return (
    <div className="min-h-screen overflow-hidden bg-cream text-charcoal">
      {/* ── BREADCRUMB ── */}
      <div className="max-w-[90rem] mx-auto px-6 sm:px-12 lg:px-20 pt-28 pb-4">
        <div className="h-3 w-40 bg-charcoal/10 animate-pulse rounded-full" />
      </div>

      {/* ── MAIN GRID ── */}
      <div className="max-w-[90rem] mx-auto px-6 sm:px-12 lg:px-20 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 xl:gap-20 items-start">
          
          {/* GALLERY SKELETON */}
          <div className="lg:col-span-7">
            <div className="flex flex-col-reverse md:flex-row gap-5">
              {/* Thumbnails */}
              <div className="hidden md:flex flex-col gap-3">
                {[...Array(4)].map((_, i) => (
                  <div 
                    key={i} 
                    className="w-[72px] h-[90px] rounded-xl bg-charcoal/10 animate-pulse"
                    style={{ border: "1px solid rgba(26,20,16,0.1)" }}
                  />
                ))}
              </div>
              
              {/* Main Image */}
              <div 
                className="flex-1 rounded-3xl bg-charcoal/10 animate-pulse" 
                style={{ aspectRatio: "4/5", border: "1px solid rgba(26,20,16,0.1)" }} 
              />
            </div>
          </div>

          {/* INFO SKELETON */}
          <div className="lg:col-span-5 space-y-10">
            <div className="space-y-4">
              <div className="h-3 w-32 bg-charcoal/10 animate-pulse rounded-full" />
              <div className="h-14 w-full bg-charcoal/10 animate-pulse rounded-2xl" />
              <div className="h-14 w-2/3 bg-charcoal/10 animate-pulse rounded-2xl" />
              <div className="pt-4 space-y-2">
                <div className="h-3 w-full bg-charcoal/10 animate-pulse rounded-full" />
                <div className="h-3 w-full bg-charcoal/10 animate-pulse rounded-full" />
                <div className="h-3 w-2/3 bg-charcoal/10 animate-pulse rounded-full" />
              </div>
            </div>

            <div className="flex items-center gap-6 py-8 border-y border-charcoal/10">
              <div className="flex gap-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-4 h-4 rounded shadow-inner bg-charcoal/10 animate-pulse" />
                ))}
              </div>
              <div className="h-3 w-24 bg-charcoal/10 animate-pulse rounded-full" />
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div className="h-3 w-24 bg-charcoal/10 animate-pulse rounded-full" />
                <div className="h-10 w-32 bg-charcoal/10 animate-pulse rounded-xl" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-14 rounded-xl bg-charcoal/10 animate-pulse" />
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="h-16 w-full bg-charcoal/10 animate-pulse rounded-2xl" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-14 bg-charcoal/10 animate-pulse rounded-xl" />
                <div className="h-14 bg-charcoal/10 animate-pulse rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Loading() {
  return <ProductSkeleton />;
}
