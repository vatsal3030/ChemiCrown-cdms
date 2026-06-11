import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted/60", className)}
      {...props}
    />
  )
}

export { Skeleton }

export function SkeletonCard() {
  return (
    <div className="bg-card border border-border p-5 rounded-2xl animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="w-24 h-5" />
        <Skeleton className="w-8 h-8 rounded-lg" />
      </div>
      <Skeleton className="w-32 h-8" />
      <Skeleton className="w-48 h-4" />
    </div>
  );
}

export function SkeletonTableRow({ columns = 5 }) {
  return (
    <tr className="border-b border-border animate-pulse">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-4">
          <Skeleton className="w-full max-w-[120px] h-5" />
          {i === 0 && <Skeleton className="w-full max-w-[80px] h-3 mt-2" />}
        </td>
      ))}
      <td className="px-4 py-4 text-right">
        <div className="flex justify-end gap-2">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="w-8 h-8 rounded-lg" />
        </div>
      </td>
    </tr>
  );
}

export function SkeletonTableBody({ rows = 5, columns = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonTableRow key={i} columns={columns} />
      ))}
    </>
  );
}

export function SkeletonChart() {
  return (
    <div className="w-full h-full min-h-[300px] flex items-end gap-2 p-4 animate-pulse">
      {Array.from({ length: 12 }).map((_, i) => (
        <div 
          key={i} 
          className="flex-1 bg-muted/60 rounded-t-md"
          style={{ height: `${Math.max(20, Math.random() * 100)}%` }}
        />
      ))}
    </div>
  );
}
