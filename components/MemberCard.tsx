'use client';

import { useState } from 'react';

import { formatDate, calculateAge, formatCurrency } from '@/lib/utils';
import type { Member } from '@/lib/types';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Shield,
  Heart,
  Users,
  CreditCard,
  Building2,
  ChevronDown,
} from 'lucide-react';

interface MemberCardProps {
  member: Member;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Active: 'badge badge-green',
    Lapsed: 'badge badge-yellow',
    Suspended: 'badge badge-red',
  };
  const dots: Record<string, string> = {
    Active: 'bg-emerald-500',
    Lapsed: 'bg-amber-500',
    Suspended: 'bg-red-500',
  };
  return (
    <span className={styles[status] ?? 'badge badge-gray'}>
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${dots[status] ?? 'bg-gray-400'}`} />
      {status}
    </span>
  );
}

function YakapBar({ used, total }: { used: number; total: number }) {
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  const remaining = total - used;
  const color = pct >= 100 ? '#ef4444' : pct >= 75 ? '#f59e0b' : '#00843D';

  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs text-gray-500">YAKAP Balance Used</span>
        <span className="text-xs font-semibold text-gray-700">
          {formatCurrency(used)} / {formatCurrency(total)}
        </span>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-gray-400">{pct.toFixed(0)}% used</span>
        <span className="text-xs font-semibold" style={{ color }}>
          {formatCurrency(remaining)} remaining
        </span>
      </div>
    </div>
  );
}

function DependentAccordion({ dependents }: { dependents: any[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-5">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-emerald-50/50 rounded-xl hover:bg-emerald-50 transition-colors border border-emerald-100"
      >
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-philgreen" />
          <span className="text-sm font-semibold text-gray-800">
            Registered Dependents ({dependents.length})
          </span>
        </div>
        <ChevronDown className={`w-5 h-5 text-philgreen transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="mt-3 grid gap-3 animate-fade-in">
          {dependents.map((dep) => (
            <div
              key={dep.id}
              className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-philgreen/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{dep.firstName} {dep.middleName || ''} {dep.lastName}</p>
                    <code className="text-xs font-mono text-philgreen-600 font-semibold tracking-wide">{dep.philhealthPin}</code>
                  </div>
                </div>
                <span className={`badge text-xs ${dep.hasConsent ? 'badge-green' : 'badge-yellow'}`}>
                  {dep.hasConsent ? 'Consent Given' : 'No Consent'}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-50 p-2 rounded-lg">
                  <p className="text-gray-400 uppercase tracking-wider mb-0.5">Date of Birth</p>
                  <p className="font-medium text-gray-800">{formatDate(dep.dateOfBirth)}</p>
                </div>
                <div className="bg-gray-50 p-2 rounded-lg">
                  <p className="text-gray-400 uppercase tracking-wider mb-0.5">Sex</p>
                  <p className="font-medium text-gray-800">{dep.sex}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MemberCard({ member }: MemberCardProps) {
  const fullName = `${member.firstName} ${member.middleName || ''} ${member.lastName}${member.extension ? ` ${member.extension}` : ''}`;
  const age = calculateAge(member.dateOfBirth);

  return (
    <div className="card-glass animate-fade-in overflow-hidden">
      {/* Header strip */}
      <div className="h-2 bg-gradient-to-r from-navy-900 via-philgreen to-navy-900" />

      <div className="p-6">
        {/* Name & PIN row */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-navy-900 to-navy-700 flex items-center justify-center shadow-lg flex-shrink-0">
              <User className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 leading-tight">{fullName}</h2>
              <div className="flex items-center gap-2 mt-1">
                <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                <code className="text-sm font-mono text-philgreen-600 font-semibold tracking-wider">
                  {member.philhealthPin}
                </code>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status="Active" />
            <span className="badge badge-blue">{member.clientType}</span>
          </div>
        </div>

        {/* Demographics grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5 p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Date of Birth</p>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-500" />
              <p className="text-sm font-medium text-gray-800">
                {formatDate(member.dateOfBirth)}
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 ml-5">{age} years old</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Sex</p>
            <p className="text-sm font-medium text-gray-800">{member.sex}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Civil Status</p>
            <p className="text-sm font-medium text-gray-800">Single</p>
          </div>

        </div>

        {/* Contact */}
        <div className="flex flex-wrap gap-4 mb-5 text-sm">
          <div className="flex items-center gap-1.5 text-gray-600">
            <Phone className="w-4 h-4 text-gray-400" />
            <span>{member.mobileNumber || 'N/A'}</span>
          </div>
          {member.landlineNumber && (
            <div className="flex items-center gap-1.5 text-gray-600">
              <Phone className="w-4 h-4 text-gray-400" />
              <span>{member.landlineNumber}</span>
            </div>
          )}
          {(member.barangay || member.cityMunicipality) && (
            <div className="flex items-center gap-1.5 text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="line-clamp-1">
                {member.barangay}{member.barangay && member.cityMunicipality ? ', ' : ''}{member.cityMunicipality}
              </span>
            </div>
          )}
        </div>

        {/* YAKAP benefit */}
        <div className="mb-5 p-4 bg-emerald-50/60 rounded-xl border border-emerald-100">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-philgreen" />
            <span className="text-sm font-semibold text-gray-800">
              {member.packageType ?? 'YAKAP'} Benefit — {member.fpeRecords?.[0]?.effectivityYear ?? new Date().getFullYear()}
            </span>
            <span className="ml-auto text-xs text-gray-500">
              {(() => {
                const totalAvailments = member.eligibilityChecks?.length ?? 0;
                return `${totalAvailments} check${totalAvailments !== 1 ? 's' : ''}`;
              })()}
            </span>
          </div>
          <YakapBar used={0} total={2000} />
        </div>

        {/* Dependents */}
        {member.dependents && member.dependents.length > 0 && (
          <DependentAccordion dependents={member.dependents} />
        )}
      </div>
    </div>
  );
}
