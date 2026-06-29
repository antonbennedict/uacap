'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  UserCheck, FileText, Package, Activity, Heart,
  ChevronRight, Bell, Settings, LogOut, Stethoscope,
  LayoutDashboard, Server, FlaskConical, ClipboardList, Users,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';

const navItems = [
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
  {
    href: '/fpe',
    label: 'FPE Encoding & Submit',
    icon: Stethoscope,
    description: 'First Patient Encounter',
    color: '#00843D',
  },
  {
    href: '/consultation',
    label: 'YAKAP SOAP Notes',
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
  {
    href: '/prescription-builder',
    label: 'Prescription Builder',
    icon: FileText,
    description: 'GAMOT formulary & eRx',
    color: '#F59E0B',
  },
  {
    href: '/gamot',
    label: 'GAMOT Inventory',
    icon: Package,
    description: 'Medicine stock management',
    color: '#0EA5E9',
  },
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
        <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
          style={{ background: 'linear-gradient(135deg, #00843D, #006b32)' }}>
          <Heart className="w-5 h-5 text-white fill-white" />
        </div>
        <div>
          <h1 className="text-white font-bold text-base leading-tight">eKonsulta</h1>
          <p className="text-white/50 text-xs leading-tight">PhilHealth EMR Portal</p>
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
              style={{ background: 'linear-gradient(135deg, #00843D, #1D4ED8)' }}>
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
      <nav className="flex-1 px-0 py-3 overflow-y-auto scrollbar-thin">
        <p className="text-white/30 text-xs font-semibold uppercase tracking-widest px-7 mb-2">
          Main Modules
        </p>
        <ul className="space-y-0.5">
          {navItems.map((item) => {
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
      </nav>

      {/* Bottom actions */}
      <div className="border-t border-white/10 p-3 space-y-0.5">
        <div className="sidebar-nav-link cursor-pointer group">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-white/10">
            <Bell className="w-4 h-4" />
          </div>
          <span className="text-sm flex-1">Notifications</span>
          <span className="ml-auto text-xs bg-emerald-500 text-white rounded-full px-2 py-0.5 font-bold">3</span>
        </div>
        <div className="sidebar-nav-link cursor-pointer group">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-white/10">
            <Settings className="w-4 h-4" />
          </div>
          <span className="text-sm">Settings</span>
        </div>
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
