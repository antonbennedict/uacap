'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  UserCheck, Activity, ChevronLeft, ChevronRight,
  LayoutDashboard, Server, FlaskConical, ClipboardList, Users,
  Shield, ClipboardCheck, Clock, Pill, Package, LogOut, Settings
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
        href: '/empanelment',
        label: 'YAKAP Empanelment',
        icon: ClipboardCheck,
        description: 'PCU enrollment wizard',
        color: '#14B8A6',
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
      {
        href: '/prescription-builder',
        label: 'YAKAP Medicine (Rx)',
        icon: Pill,
        description: 'Prescriptions & allocations',
        color: '#EC4899',
      },
      {
        href: '/gamot',
        label: 'GAMOT Inventory',
        icon: Package,
        description: 'Medicine allocations & stock',
        color: '#F59E0B',
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

// Helper fallback to make sure Lucide imports are safe
import { Stethoscope } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load sidebar state on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('uacap_sidebar_collapsed');
      if (savedState) {
        setIsCollapsed(savedState === 'true');
      }
    } catch (e) {
      console.error('Failed to load sidebar collapsed state:', e);
    }
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('uacap_sidebar_collapsed', String(next));
      return next;
    });
  };

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      toast.success('Signed out successfully');
      router.push('/login');
    } catch {
      router.push('/login');
    }
  };

  const userInitials = session?.user?.name
    ? session.user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'AD';

  const userName = session?.user?.name ?? 'Admin User';
  const userRole = 'Clinic Administrator';

  return (
    <aside 
      className={`sidebar flex-shrink-0 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-16' : 'w-64'}`}
      style={{ boxShadow: '2px 0 20px rgba(0,0,0,0.2)' }}
    >
      {/* Header / Logo */}
      <div className={`sidebar-logo flex items-center justify-between ${isCollapsed ? 'px-2 justify-center' : 'px-4'} py-3 border-b border-white/10`}>
        {isCollapsed ? (
          <button 
            onClick={toggleCollapse}
            className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm overflow-hidden bg-white border border-white/20 hover:opacity-90 transition-all duration-200 animate-fade-in"
            title="Expand sidebar"
          >
            <img src="/uacap-logo.png" alt="UACAP Logo" className="w-full h-full object-cover" />
          </button>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-sm overflow-hidden bg-white border border-white/20">
                <img src="/uacap-logo.png" alt="UACAP Logo" className="w-full h-full object-cover" />
              </div>
              <div className="animate-fade-in">
                <h1 className="text-white font-bold text-base leading-tight">UACAP</h1>
                <p className="text-white/50 text-[10px] leading-tight uppercase tracking-wider mt-0.5">Univ. of Assumption</p>
              </div>
            </div>
            <button 
              onClick={toggleCollapse} 
              className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* User info */}
      <div className={`px-2 py-1.5 mt-2 ${isCollapsed ? 'flex justify-center' : ''}`}>
        {isCollapsed ? (
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ring-2 ring-white/10 hover:ring-white/30 transition-all duration-200"
            style={{ background: 'linear-gradient(135deg, #004B87, #002D51)' }}
            title={`${userName} (${userRole})`}
          >
            {userInitials}
          </div>
        ) : (
          <div className="px-3 py-2 rounded-xl border animate-fade-in" style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #004B87, #002D51)' }}>
                {userInitials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-semibold truncate">{userName}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Shield className="w-2.5 h-2.5 text-emerald-400 flex-shrink-0" />
                  <p className="text-white/50 text-[10px] truncate">{userRole}</p>
                </div>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 ring-2 ring-emerald-400/20" />
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-0 py-1 space-y-2.5 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
        {navGroups.map((group) => (
          <div key={group.category} className="space-y-1">
            {!isCollapsed ? (
              <p className="text-white/30 text-[9px] font-bold uppercase tracking-widest px-5 mb-0.5 animate-fade-in">
                {group.category}
              </p>
            ) : (
              <div className="h-px bg-white/10 my-2 mx-3" />
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={isCollapsed ? item.label : undefined}
                      className={`sidebar-nav-link group ${isActive ? 'active' : ''} ${isCollapsed ? 'justify-center mx-1.5 px-0' : ''}`}
                      style={isActive ? {
                        background: `linear-gradient(135deg, ${item.color}22, ${item.color}11)`,
                        borderLeft: isCollapsed ? 'none' : `3px solid ${item.color}`,
                        color: '#ffffff',
                        marginLeft: isCollapsed ? '0.375rem' : '0.75rem',
                        paddingLeft: isCollapsed ? '0px' : '0.5rem',
                        boxShadow: `0 4px 15px ${item.color}33`,
                      } : {}}
                    >
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                        isActive ? '' : 'group-hover:bg-white/10'
                      }`}
                        style={isActive ? { background: `${item.color}25` } : {}}>
                        <Icon className="w-3.5 h-3.5 flex-shrink-0" style={isActive ? { color: item.color } : {}} />
                      </div>
                      {!isCollapsed && (
                        <div className="flex-1 min-w-0 animate-fade-in">
                          <span className="block text-xs leading-tight">{item.label}</span>
                        </div>
                      )}
                      {!isCollapsed && isActive && (
                        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 opacity-70" style={{ color: item.color }} />
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
      <div className="border-t border-white/10 p-2 space-y-0.5">
        <Link 
          href="/audit-log" 
          title={isCollapsed ? "Audit Log" : undefined} 
          className={`sidebar-nav-link cursor-pointer group ${isCollapsed ? 'justify-center mx-1.5 px-0' : ''}`}
        >
          <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-white/10">
            <Clock className="w-3.5 h-3.5" />
          </div>
          {!isCollapsed && <span className="text-xs flex-1 animate-fade-in">Audit Log</span>}
        </Link>
        <Link 
          href="/settings" 
          title={isCollapsed ? "Settings" : undefined} 
          className={`sidebar-nav-link cursor-pointer group ${isCollapsed ? 'justify-center mx-1.5 px-0' : ''}`}
        >
          <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-white/10">
            <Settings className="w-3.5 h-3.5" />
          </div>
          {!isCollapsed && <span className="text-xs flex-1 animate-fade-in">Settings</span>}
        </Link>
        <button
          onClick={handleLogout}
          title={isCollapsed ? "Log Out" : undefined}
          className={`sidebar-nav-link w-full text-left group ${isCollapsed ? 'justify-center mx-1.5 px-0' : ''}`}
          style={{ color: '#fca5a5' }}
        >
          <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-red-500/10">
            <LogOut className="w-3.5 h-3.5" />
          </div>
          {!isCollapsed && <span className="text-xs flex-1 animate-fade-in">Log Out</span>}
        </button>
      </div>

      {/* PhilHealth branding */}
      <div className={`px-4 py-2 border-t border-white/5 ${isCollapsed ? 'flex justify-center' : ''}`}>
        {!isCollapsed ? (
          <div className="animate-fade-in">
            <div className="flex items-center gap-2 opacity-40">
              <Activity className="w-3 h-3 text-emerald-400" />
              <span className="text-white text-[10px]">PhilHealth YAKAP Program</span>
            </div>
            <p className="text-white/25 text-[9px] mt-0.5">v2026.1.0 · NCR Division</p>
          </div>
        ) : (
          <div title="PhilHealth YAKAP v2026.1.0">
            <Activity className="w-3 h-3 text-emerald-400 opacity-40 animate-pulse" />
          </div>
        )}
      </div>
    </aside>
  );
}
