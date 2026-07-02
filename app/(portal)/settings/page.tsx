'use client';

import { useState } from 'react';
import { 
  Settings as SettingsIcon, Building2, UserCog, Shield, 
  Bell, Moon, Database, Key, CheckCircle, Save
} from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('clinic');
  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Settings saved successfully!');
    }, 600);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #1E293B, #0F172A)' }}>
            <SettingsIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
            <p className="text-sm text-gray-500">Configure clinic profile, security, and PhilHealth compliance.</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={loading} className="btn-primary" style={{ background: '#004B87' }}>
          {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-1">
          {[
            { id: 'clinic', label: 'Clinic Profile', icon: Building2 },
            { id: 'preferences', label: 'Preferences', icon: Moon },
            { id: 'security', label: 'Security & Access', icon: Shield },
            { id: 'compliance', label: 'PhilHealth Compliance', icon: Database },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeTab === tab.id 
                  ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}`} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 card-glass p-6 md:p-8 min-h-[500px]">
          
          {/* Clinic Profile */}
          {activeTab === 'clinic' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Clinic Profile</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Institution Name</label>
                  <input type="text" defaultValue="University of the Assumption Clinic" className="form-input" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">PhilHealth PAN</label>
                  <input type="text" defaultValue="H987654321" className="form-input font-mono" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Address</label>
                  <input type="text" defaultValue="San Fernando, Pampanga" className="form-input" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Contact Number</label>
                  <input type="text" defaultValue="+63 912 345 6789" className="form-input" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email Address</label>
                  <input type="email" defaultValue="clinic@ua.edu.ph" className="form-input" />
                </div>
              </div>
            </div>
          )}

          {/* Preferences */}
          {activeTab === 'preferences' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-lg font-bold text-gray-900 border-b pb-2">System Preferences</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-xl bg-gray-50/50">
                  <div>
                    <h3 className="font-semibold text-gray-900">Push Notifications</h3>
                    <p className="text-xs text-gray-500">Receive alerts for new triage entries and stock warnings.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-xl bg-gray-50/50">
                  <div>
                    <h3 className="font-semibold text-gray-900">Dark Mode</h3>
                    <p className="text-xs text-gray-500">Enable dark theme for the entire application.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 mt-4">Session Timeout</label>
                  <select className="form-input w-full md:w-64">
                    <option>15 Minutes</option>
                    <option>30 Minutes</option>
                    <option>1 Hour</option>
                    <option>Never</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Security */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Security & Access</h2>
              
              <div className="p-4 border border-blue-100 bg-blue-50/50 rounded-xl space-y-3">
                <h3 className="font-semibold text-blue-900 flex items-center gap-2"><Key className="w-4 h-4" /> Change Password</h3>
                <div className="grid grid-cols-1 gap-4 max-w-md">
                  <input type="password" placeholder="Current Password" className="form-input" />
                  <input type="password" placeholder="New Password" className="form-input" />
                  <input type="password" placeholder="Confirm New Password" className="form-input" />
                  <button className="btn-secondary w-fit">Update Password</button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-xl bg-gray-50/50">
                <div>
                  <h3 className="font-semibold text-gray-900">Two-Factor Authentication (2FA)</h3>
                  <p className="text-xs text-gray-500">Require an OTP when logging in from unrecognized devices.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
            </div>
          )}

          {/* Compliance */}
          {activeTab === 'compliance' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-lg font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" /> PhilHealth Circular 2024-0013
              </h2>
              <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
                <p>The UACAP system is natively configured to comply with the <strong className="text-gray-900">PhilHealth Circular No. 2024-0013</strong> documentation standards. This includes mandatory structural encoding for FPE (First Patient Encounter) and SOAP consultations.</p>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                  <h3 className="font-semibold text-emerald-900 mb-2">Active Compliance Modules:</h3>
                  <ul className="list-disc pl-5 space-y-1 text-emerald-800">
                    <li>Strict ICD-10 Coding validations</li>
                    <li>e-Prescription generation with generic name mandates</li>
                    <li>Referral capability logs and audit trails</li>
                    <li>XML schema generation mapping for batch transmittals</li>
                  </ul>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 mt-4">Data Retention Policy</label>
                  <select className="form-input w-full md:w-64">
                    <option>5 Years (Standard)</option>
                    <option>7 Years (Extended)</option>
                    <option>10 Years</option>
                  </select>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
