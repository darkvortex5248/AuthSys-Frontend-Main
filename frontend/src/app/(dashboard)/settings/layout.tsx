'use client';
import { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Webhook } from 'lucide-react';

const GROUPS: { id: string; label: string; icon: string }[] = [
  { id: 'account',   label: 'Account',   icon: 'person'          },
  { id: 'billing',   label: 'Billing',    icon: 'credit_card'     },
  { id: 'system',    label: 'System',     icon: 'settings'        },
  { id: 'workspace', label: 'Workspace',  icon: 'corporate_fare'  },
  { id: 'developer', label: 'Developer',  icon: 'code'            },
];

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const activeGroup = pathname.split('/')[2] || 'account';

  return (
    <div className="page-wrapper pt-6 space-y-6 overflow-visible">
      <div>
        <h2 className="page-title mb-2">
          Account <span className="text-gradient">Settings</span>
        </h2>
        <p className="page-subtitle">
          Manage your identity, security, preferences, and billing.
        </p>
      </div>

      <div className="flex gap-1 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.06] w-full max-w-full overflow-x-auto custom-scrollbar">
        {GROUPS.map(group => (
          <button
            key={group.id}
            onClick={() => router.push(`/settings/${group.id}`)}
            className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
              activeGroup === group.id
                ? 'bg-[var(--primary)] text-[#131313] shadow-lg shadow-[var(--accent-opacity-20)]'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-white/5'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{group.icon}</span>
            {group.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}
