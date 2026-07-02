'use client';

import { useState, useCallback, useEffect } from 'react';
import MemberCard from '@/components/MemberCard';
import ClinicMap from '@/components/ClinicMap';
import type { Member, Clinic } from '@/lib/types';
import { Search, X, UserCheck, AlertCircle, Loader2, ChevronDown, Users } from 'lucide-react';
import * as Accordion from '@radix-ui/react-accordion';
import { toast } from 'sonner';

const clinics: Clinic[] = []; // Replaced mock clinics data

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
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    async function fetchMembers() {
      try {
        const response = await fetch('/api/members');
        const data = await response.json();
        if (data.members) {
          setAllMembers(data.members);
        }
      } catch (error) {
        console.error('Failed to fetch members:', error);
      }
    }
    fetchMembers();
  }, []);

  const selectedClinic = null;

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
      
      const foundMembers = allMembers.filter((m) => {
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
  }, [query, allMembers]);

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
            <p className="text-2xl font-bold text-gray-900 mt-1">{allMembers.length}</p>
          </div>
          <div className="card-stat flex-1 min-w-[140px]">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Active Members</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{allMembers.length}</p>
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

      {/* Multiple results list with Radix Accordion */}
      {hasSearched && results.length > 1 && !selectedMember && (
        <div className="card-glass p-4 mb-6 animate-fade-in">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            {results.length} Members Found — Select a member or expand to view dependents:
          </h3>
          <Accordion.Root type="single" collapsible className="space-y-2">
            {results.map((m) => (
              <Accordion.Item key={m.id} value={m.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#004B87]/50 focus-within:border-[#004B87]">
                <Accordion.Header className="flex">
                  <Accordion.Trigger className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-all text-left group">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 text-sm group-hover:text-[#004B87] transition-colors">
                          {m.firstName} {m.middleName} {m.lastName}{m.extension ? ` ${m.extension}` : ''}
                        </p>
                        {m.clientType === 'DEPENDENT' && (
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase">Dependent</span>
                        )}
                      </div>
                      <p className="text-xs font-mono text-gray-400 mt-0.5">{m.philhealthPin}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="badge badge-green">
                        Active
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-400 transition-transform duration-300 ease-[cubic-bezier(0.87,_0,_0.13,_1)] group-data-[state=open]:rotate-180" aria-hidden />
                    </div>
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down bg-slate-50/50">
                  <div className="px-4 py-3 border-t border-gray-100">
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" /> Declared Dependents
                      </p>
                      <button
                        onClick={() => setSelectedMember(m)}
                        className="text-xs bg-[#004B87] hover:bg-[#003666] text-white px-3 py-1.5 rounded-md font-medium transition-colors shadow-sm"
                      >
                        View Full Record
                      </button>
                    </div>
                    
                    {(!m.dependents || m.dependents.length === 0) ? (
                      <p className="text-sm text-slate-400 italic py-2">No registered dependents found for this member.</p>
                    ) : (
                      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                        <table className="w-full text-left text-sm text-slate-600">
                          <thead className="bg-slate-50/80 border-b border-slate-200">
                            <tr>
                              <th className="px-3 py-2 font-semibold">Full Name</th>
                              <th className="px-3 py-2 font-semibold">Relationship</th>
                              <th className="px-3 py-2 font-semibold">Sex</th>
                              <th className="px-3 py-2 font-semibold">Date of Birth</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {m.dependents.map(dep => (
                              <tr key={dep.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-3 py-2 font-medium text-slate-800">{dep.fullName}</td>
                                <td className="px-3 py-2 text-xs">
                                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">{dep.relationship}</span>
                                </td>
                                <td className="px-3 py-2">{dep.sex}</td>
                                <td className="px-3 py-2 font-mono text-xs">{new Date(dep.dateOfBirth).toLocaleDateString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
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
          <ClinicMap />
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
