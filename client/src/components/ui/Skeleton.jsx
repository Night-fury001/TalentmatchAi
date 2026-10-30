import clsx from 'clsx';

export function SkeletonLine({ className }) {
  return <div className={clsx('skeleton h-4 rounded-lg', className)} />;
}

export function SkeletonCircle({ size = 'w-10 h-10' }) {
  return <div className={clsx('skeleton rounded-full', size)} />;
}

export function SkeletonCard() {
  return (
    <div className="surface p-6 space-y-4">
      <div className="flex items-center gap-3">
        <SkeletonCircle />
        <div className="flex-1 space-y-2">
          <SkeletonLine className="w-1/3" />
          <SkeletonLine className="w-1/2" />
        </div>
      </div>
      <SkeletonLine className="w-full" />
      <SkeletonLine className="w-2/3" />
    </div>
  );
}

export function SkeletonList({ count = 4 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
