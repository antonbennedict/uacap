'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  UserCheck, Activity, Heart,
  ChevronRight, Bell, Settings, LogOut, Stethoscope,
  LayoutDashboard, Server, FlaskConical, ClipboardList, Users,
  Shield, ClipboardCheck, Clock
} from 'lucide-react';
import { toast } from 'sonner';

const navGroups = [
  {
    category: 'PhilCheck',
    items: [
      {
        href: '/dashboard',
        label: 'OPD Dashboard',
        icon: LayoutDashboard,
        description: 'Triage & daily operations',
        color: '#3B82F6',
      },
      {
        href: '/eligibility',
        label: 'Benefit Eligibility (PBEF)',
        icon: UserCheck,
        description: 'CEWS verification & YAKAP',
        color: '#10B981',
      },
    ],
  },
  {
    category: 'UACAP',
    items: [
      {
        href: '/fpe',
        label: 'FPE Encoding & Submit',
        icon: Stethoscope,
        description: 'First Patient Encounter',
        color: '#00843D',
      },
      {
        href: '/empanelment',
        label: 'YAKAP Empanelment',
        icon: ClipboardCheck,
        description: 'PCU enrollment wizard',
        color: '#14B8A6',
      },
      {
        href: '/consultation',
        label: 'YAKAP Consultation',
        icon: ClipboardList,
        description: 'Consultation & follow-ups',
        color: '#8B5CF6',
      },
      {
        href: '/lab-results',
        label: 'Lab Results Encoding',
        icon: FlaskConical,
        description: 'Diagnostics & findings',
        color: '#EF4444',
      },
    ],
  },
  {
    category: 'Import & Export',
    items: [
      {
        href: '/masterlist',
        label: 'Masterlist Import',
        icon: Users,
        description: 'Automated roster sync',
        color: '#6366F1',
      },
      {
        href: '/transmittal',
        label: 'Direct PHIC Dispatch',
        icon: Server,
        description: 'Transmittal portal',
        color: '#EC4899',
      },
      {
        href: '/reports',
        label: 'Reports & Database',
        icon: Activity,
        description: 'Live charts & records',
        color: '#F59E0B',
      },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      toast.success('Signed out successfully');
      router.push('/login');
    } catch {
      // Fallback: just navigate to login
      router.push('/login');
    }
  };

  const userInitials = session?.user?.name
    ? session.user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'AD';

  const userName = session?.user?.name ?? 'Admin User';
  const userRole = 'Clinic Administrator';

  return (
    <aside className="sidebar flex-shrink-0" style={{ boxShadow: '2px 0 20px rgba(0,0,0,0.2)' }}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm overflow-hidden bg-white/10 border border-white/20">
          <img src="/ua-logo.png" alt="UA Logo" className="w-8 h-8 object-contain" />
        </div>
        <div>
          <h1 className="text-white font-bold text-base leading-tight">UACAP</h1>
          <p className="text-white/50 text-[10px] leading-tight uppercase tracking-wider mt-0.5">University of the Assumption</p>
        </div>
      </div>

      {/* User info */}
      <div className="px-3 py-3 mt-4">
        <div className="px-4 py-3.5 rounded-xl border" style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #004B87, #002D51)' }}>
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{userName}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Shield className="w-2.5 h-2.5 text-emerald-400 flex-shrink-0" />
                <p className="text-white/50 text-xs truncate">{userRole}</p>
              </div>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 ring-2 ring-emerald-400/20" />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-0 py-3 overflow-y-auto scrollbar-thin space-y-5">
        {navGroups.map((group) => (
          <div key={group.category} className="space-y-1">
            <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest px-7 mb-1">
              {group.category}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`sidebar-nav-link group ${isActive ? 'active' : ''}`}
                      style={isActive ? {
                        background: `linear-gradient(135deg, ${item.color}22, ${item.color}11)`,
                        borderLeft: `3px solid ${item.color}`,
                        color: '#ffffff',
                        marginLeft: '0.75rem',
                        paddingLeft: '0.75rem',
                        boxShadow: `0 4px 15px ${item.color}33`,
                      } : {}}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                        isActive ? '' : 'group-hover:bg-white/10'
                      }`}
                        style={isActive ? { background: `${item.color}25` } : {}}>
                        <Icon className="w-4 h-4 flex-shrink-0" style={isActive ? { color: item.color } : {}} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="block text-sm leading-tight">{item.label}</span>
                        {isActive && (
                          <span className="block text-xs text-white/50 leading-tight mt-0.5">{item.description}</span>
                        )}
                      </div>
                      {isActive && (
                        <ChevronRight className="w-4 h-4 flex-shrink-0 opacity-70" style={{ color: item.color }} />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="border-t border-white/10 p-3 space-y-0.5">
        <Link href="/audit-log" className="sidebar-nav-link cursor-pointer group block">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-white/10">
            <Clock className="w-4 h-4" />
          </div>
          <span className="text-sm flex-1">Audit Log</span>
        </Link>
        <Link href="/settings" className="sidebar-nav-link cursor-pointer group block">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-white/10">
            <Settings className="w-4 h-4" />
          </div>
          <span className="text-sm">Settings</span>
        </Link>
        <button
          onClick={handleLogout}
          className="sidebar-nav-link w-full text-left group"
          style={{ color: '#fca5a5' }}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-red-500/10">
            <LogOut className="w-4 h-4" />
          </div>
          <span className="text-sm">Log Out</span>
        </button>
      </div>

      {/* PhilHealth branding */}
      <div className="px-5 py-4 border-t border-white/5">
        <div className="flex items-center gap-2 opacity-40">
          <Activity className="w-3 h-3 text-emerald-400" />
          <span className="text-white text-xs">PhilHealth YAKAP Program</span>
        </div>
        <p className="text-white/25 text-xs mt-0.5">v2026.1.0 · NCR Division</p>
      </div>
    </aside>
  );
}
