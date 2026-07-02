import { create } from 'zustand';

interface AppState {
  isLoading: boolean;
  isBulkImporting: boolean;
  error: string | null;
  dashboardMetrics: any;
  
  // Asynchronous API Action Signatures
  // Asynchronous API Action Signatures
  importMasterlistEntries: (payload: any[]) => Promise<void>;
  importBulkCSVData: (parsedRows: any[]) => Promise<boolean>;
  fetchDashboardMetrics: () => Promise<void>;
  saveFPERecord: (payload: any) => Promise<void>;
  saveSOAPNote: (payload: any) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  isLoading: false,
  isBulkImporting: false,
  error: null,
  dashboardMetrics: null,

  importMasterlistEntries: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/members/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Import failed');
      
      const data = await response.json();
      console.log(`Successfully imported ${data.count} members.`);
      
      await get().fetchDashboardMetrics();
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  importBulkCSVData: async (parsedRows) => {
    set({ isBulkImporting: true, error: null });
    try {
      const response = await fetch('/api/settings/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: parsedRows }),
      });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Import failed');
      
      console.log(`Imported ${data.insertedCount}, Skipped ${data.skippedCount}`);
      await get().fetchDashboardMetrics();
      return true;
    } catch (err: any) {
      set({ error: err.message });
      return false;
    } finally {
      set({ isBulkImporting: false });
    }
  },

  fetchDashboardMetrics: async () => {
    try {
      const response = await fetch('/api/dashboard/metrics');
      const data = await response.json();
      set({ dashboardMetrics: data.metrics });
    } catch (err: any) {
      console.error('Failed to load metrics', err);
    }
  },

  saveFPERecord: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/hsa/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('FPE save failed');
      
      await get().fetchDashboardMetrics();
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  saveSOAPNote: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/consultations/soap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('SOAP note save failed');
      
      await get().fetchDashboardMetrics();
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  }
}));
