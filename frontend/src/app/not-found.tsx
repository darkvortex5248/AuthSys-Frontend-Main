import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--color-accent-dim)] flex items-center justify-center">
          <span className="material-symbols-outlined text-3xl text-[var(--color-accent)]">search_off</span>
        </div>
        <h1 className="text-6xl font-black text-white mb-2">404</h1>
        <p className="text-lg text-[var(--color-text-secondary)] mb-2">Page not found</p>
        <p className="text-sm text-[var(--color-text-muted)] mb-8">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <Link
          href="/"
          className="inline-flex px-6 py-2.5 rounded-xl bg-[var(--color-accent)] text-white font-bold text-sm hover:opacity-90 transition-all"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}