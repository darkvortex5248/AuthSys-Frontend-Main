'use client';
export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-end">
        <div className="space-y-3">
          <div className="h-10 w-52 bg-[var(--accent-opacity-8)] rounded-xl" />
          <div className="h-4 w-64 bg-[var(--accent-opacity-8)] rounded-xl" />
        </div>
        <div className="h-10 w-44 bg-[var(--accent-opacity-8)] rounded-xl" />
      </div>
      <div className="h-80 bg-[var(--accent-opacity-8)] rounded-2xl" />
    </div>
  );
}
