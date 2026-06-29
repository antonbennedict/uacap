'use client';

import { useState, useCallback } from 'react';
import MemberCard from '@/components/MemberCard';
import ClinicLocationCard from '@/components/ClinicLocationCard';
import type { Member, Clinic } from '@/lib/types';
import clinicsData from '@/lib/data/clinics.json';
import { useAppStore } from '@/lib/store';
import { Search, X, UserCheck, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const clinics: Clinic[] = clinicsData as Clinic[];

function SkeletonCard() {
  return (
    <div className="card-glass p-6 animate-pulse space-y-4">
      <div className="flex gap-4">
        <div className="skeleton w-14 h-14 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-5 w-2/3 rounded" />
          <div className="skeleton h-4 w-1/3 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-1">
            <div className="skeleton h-3 w-full rounded" />
            <div className="skeleton h-4 w-2/3 rounded" />
          </div>
        ))}
      </div>
      <div className="skeleton h-16 w-full rounded-xl" />
    </div>
  );
}

export default function EligibilityPage() {
  const { members } = useAppStore();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const selectedClinic = selectedMember
    ? clinics.find((c) => c.id === selectedMember.registeredClinicId) ?? null
    : null;

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      toast.error('Please enter a PhilHealth PIN or member name to search.');
      return;
    }

    setIsLoading(true);
    setHasSearched(false);
    setSelectedMember(null);

    try {
      // Simulate network delay for UX
      await new Promise((resolve) => setTimeout(resolve, 600));

      const searchTerms = query.trim().toLowerCase();
      
      const foundMembers = members.filter((m) => {
        const fullName = `${m.firstName} ${m.middleName} ${m.lastName}`.toLowerCase();
        const pin = m.philhealthPin.toLowerCase();
        return fullName.includes(searchTerms) || pin.includes(searchTerms) ||
          m.lastName.toLowerCase().includes(searchTerms) ||
          m.firstName.toLowerCase().includes(searchTerms);
      });
      
      setResults(foundMembers);
      setHasSearched(true);

      if (foundMembers.length === 0) {
        toast.warning('No members found matching your search. Please verify the PIN or name.');
      } else if (foundMembers.length === 1) {
        setSelectedMember(foundMembers[0]);
        toast.success(`Member found: ${foundMembers[0].firstName} ${foundMembers[0].lastName}`);
      } else {
        toast.info(`${foundMembers.length} members found. Select one below.`);
      }
    } catch {
      toast.error('Failed to search members. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setSelectedMember(null);
    setHasSearched(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-philgreen flex items-center justify-center shadow-md">
            <UserCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Eligibility & YAKAP Check</h1>
            <p className="text-sm text-gray-500">Search by PhilHealth PIN or full name</p>
          </div>
        </div>

        {/* Quick stats bar */}
        <div className="mt-4 flex gap-3 flex-wrap">
          <div className="card-stat flex-1 min-w-[140px]">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Members Enrolled</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{members.length}</p>
          </div>
          <div className="card-stat flex-1 min-w-[140px]">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Active Members</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{members.filter(m => m.membershipStatus === 'Active').length}</p>
          </div>
          <div className="card-stat flex-1 min-w-[140px]">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Lapsed Members</p>
            <p className="text-2xl font-bold text-amber-500 mt-1">2</p>
          </div>
          <div className="card-stat flex-1 min-w-[140px]">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Registered Clinics</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">4</p>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="card-glass p-4 mb-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 w-5 h-5" />
            <input
              id="eligibility-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter PhilHealth PIN (e.g., 01-234567890-1) or full name..."
              className="form-input pl-10 pr-10"
            />
            {query && (
              <button
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            id="eligibility-search-btn"
            onClick={handleSearch}
            disabled={isLoading}
            className="btn-primary min-w-[120px] justify-center"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 ml-1">
          Try: <code className="bg-gray-100 px-1 rounded font-mono">01-234567890-1</code>,{' '}
          <code className="bg-gray-100 px-1 rounded font-mono">Santos</code>,{' '}
          <code className="bg-gray-100 px-1 rounded font-mono">Maria</code>, or{' '}
          <code className="bg-gray-100 px-1 rounded font-mono">Garcia</code>
        </p>
      </div>

      {/* Multiple results list */}
      {hasSearched && results.length > 1 && !selectedMember && (
        <div className="card-glass p-4 mb-6 animate-fade-in">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            {results.length} Members Found — Select a member:
          </h3>
          <div className="space-y-2">
            {results.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedMember(m)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-philgreen hover:bg-emerald-50/30 transition-all text-left group"
              >
                <div>
                  <p className="font-semibold text-gray-900 text-sm group-hover:text-philgreen-700 transition-colors">
                    {m.firstName} {m.middleName} {m.lastName}{m.suffix ? ` ${m.suffix}` : ''}
                  </p>
                  <p className="text-xs font-mono text-gray-400 mt-0.5">{m.philhealthPin}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`badge ${
                      m.membershipStatus === 'Active' ? 'badge-green' : 'badge-yellow'
                    }`}
                  >
                    {m.membershipStatus}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {/* No results */}
      {hasSearched && results.length === 0 && !isLoading && (
        <div className="card-glass p-12 text-center animate-fade-in">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-700">No Members Found</h3>
          <p className="text-sm text-gray-400 mt-1">
            No PhilHealth member matches your search for &ldquo;<strong>{query}</strong>&rdquo;.
            <br />
            Please verify the PIN or name and try again.
          </p>
        </div>
      )}

      {/* Main results */}
      {selectedMember && !isLoading && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-fade-in">
          <MemberCard member={selectedMember} />
          {selectedClinic && <ClinicLocationCard clinic={selectedClinic} />}
        </div>
      )}

      {/* Initial empty state */}
      {!hasSearched && !isLoading && (
        <div className="card-glass p-16 text-center">
          <div className="w-20 h-20 rounded-full bg-philgreen/10 flex items-center justify-center mx-auto mb-4">
            <UserCheck className="w-10 h-10 text-philgreen" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            PhilHealth Eligibility Lookup
          </h3>
          <p className="text-sm text-gray-400 max-w-sm mx-auto">
            Search for a PhilHealth member by PIN number or full name to view their eligibility
            status, YAKAP benefit balance, and registered clinic information.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {['01-234567890-1', 'Santos', 'Garcia', 'Fernandez'].map((hint) => (
              <button
                key={hint}
                onClick={() => { setQuery(hint); }}
                className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-philgreen/10 text-xs font-mono text-gray-500 hover:text-philgreen transition-colors border border-gray-200 hover:border-philgreen/30"
              >
                {hint}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
