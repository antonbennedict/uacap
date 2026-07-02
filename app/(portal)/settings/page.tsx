'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { UploadCloud, CheckCircle, Database, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { importBulkCSVData, isBulkImporting } = useAppStore();
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a CSV file first.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      const lines = text.split('\n');
      if (lines.length < 2) {
        toast.error('File appears to be empty or missing headers.');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const parsedRows = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const values = line.split(',');
        const rowData: any = {};
        
        headers.forEach((header, index) => {
          rowData[header] = values[index]?.trim();
        });
        
        parsedRows.push(rowData);
      }

      const success = await importBulkCSVData(parsedRows);
      if (success) {
        toast.success(`Successfully processed ${parsedRows.length} CSV rows! Dashboard metrics refreshed.`);
        setFile(null);
      } else {
        toast.error('Failed to import data. Check console logs.');
      }
    };
    
    reader.readAsText(file);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center shadow-md">
          <Database className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings & Configuration</h1>
          <p className="text-sm text-gray-500">Database Tools & Bulk Import</p>
        </div>
      </div>

      <div className="card-glass p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Bulk Member CSV Import</h2>
        <p className="text-sm text-gray-500 mb-6">
          Upload a CSV file to rapidly seed the PostgreSQL database. Ensure your file contains the following exact headers: 
          <code className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded mx-1 text-xs">philhealthPin, lastName, firstName, dateOfBirth, sex, clientType, hasConsent</code>
        </p>

        <div className="border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center hover:bg-gray-50 transition-colors relative">
          <UploadCloud className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-700 mb-1">Click to upload or drag and drop</p>
          <p className="text-xs text-gray-500 mb-4">CSV files only (max 5MB)</p>
          
          <input 
            type="file" 
            accept=".csv" 
            onChange={handleFileChange}
            disabled={isBulkImporting}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>

        {file && (
          <div className="mt-4 flex items-center justify-between p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
            <div className="flex items-center gap-2 text-emerald-800 text-sm font-medium">
              <CheckCircle className="w-4 h-4" />
              {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </div>
          </div>
        )}

        <div className="mt-6">
          <button 
            onClick={handleImport} 
            disabled={!file || isBulkImporting}
            className="btn-primary w-full justify-center py-3 bg-gray-900 hover:bg-black disabled:opacity-50"
          >
            {isBulkImporting ? 'Importing Database Stream...' : 'Start Database Import'}
          </button>
        </div>

        <div className="mt-6 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 p-3 rounded-lg">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <p>
            Records with an existing <span className="font-mono font-bold">philhealthPin</span> will be automatically skipped during transaction mapping to maintain strict foreign key integrity in the PostgreSQL schema.
          </p>
        </div>
      </div>
    </div>
  );
}
