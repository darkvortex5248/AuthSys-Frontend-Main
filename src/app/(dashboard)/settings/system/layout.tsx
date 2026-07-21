'use client';
import { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const TABS: { id: string; label: string; icon: string }[] = [
  { id: 'domains',       label: 'Domains',       icon: 'language'        },
  { id: 'environments',  label: 'Environments',  icon: 'layers'          },
  { id: 'backups',       label: 'Backups',       icon: 'backup'          },
  { id: 'health',        label: 'Health',        icon: 'monitor_heart'   },
  { id: 'webhooks',      label: 'Webhooks',      icon: 'webhook'         },
];

export default function SystemLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const activeTab = pathname.split('/')[3] || 'domains';

  return (
    <div className="space-y-6">
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => router.push(`/settings/system/${tab.id}`)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-[var(--primary)] text-[#131313]'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
      <div>{children}</div>
    </div>
  );
}
