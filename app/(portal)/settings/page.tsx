'use client';

import { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, Building2, UserCog, Shield, 
  Bell, Moon, Database, Key, CheckCircle, Save, Trash2, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('clinic');
  const [loading, setLoading] = useState(false);

  // Clinic profile states
  const [clinicName, setClinicName] = useState('University of the Assumption Clinic');
  const [philhealthPan, setPhilhealthPan] = useState('H987654321');
  const [address, setAddress] = useState('San Fernando, Pampanga');
  const [contactNumber, setContactNumber] = useState('+63 912 345 6789');
  const [email, setEmail] = useState('clinic@ua.edu.ph');

  // Preference states
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('30 Minutes');

  // Compliance states
  const [dataRetention, setDataRetention] = useState('5 Years (Standard)');

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedClinic = localStorage.getItem('uacap_settings_clinic');
      if (savedClinic) {
        const parsed = JSON.parse(savedClinic);
        setClinicName(parsed.clinicName || '');
        setPhilhealthPan(parsed.philhealthPan || '');
        setAddress(parsed.address || '');
        setContactNumber(parsed.contactNumber || '');
        setEmail(parsed.email || '');
      }

      const savedPrefs = localStorage.getItem('uacap_settings_preferences');
      if (savedPrefs) {
        const parsed = JSON.parse(savedPrefs);
        setNotificationsEnabled(parsed.notificationsEnabled !== false);
        setDarkModeEnabled(parsed.darkModeEnabled === true);
        setSessionTimeout(parsed.sessionTimeout || '30 Minutes');
      }

      const savedCompliance = localStorage.getItem('uacap_settings_compliance');
      if (savedCompliance) {
        const parsed = JSON.parse(savedCompliance);
        setDataRetention(parsed.dataRetention || '5 Years (Standard)');
      }
    } catch (e) {
      console.error('Failed to load settings from localStorage:', e);
    }
  }, []);

  // Sync dark mode toggle in real-time
  const handleDarkModeToggle = (checked: boolean) => {
    setDarkModeEnabled(checked);
    if (checked) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Save all settings to localStorage and log audit trail
  const handleSave = async () => {
    setLoading(true);
    try {
      const clinicData = { clinicName, philhealthPan, address, contactNumber, email };
      const preferenceData = { notificationsEnabled, darkModeEnabled, sessionTimeout };
      const complianceData = { dataRetention };

      localStorage.setItem('uacap_settings_clinic', JSON.stringify(clinicData));
      localStorage.setItem('uacap_settings_preferences', JSON.stringify(preferenceData));
      localStorage.setItem('uacap_settings_compliance', JSON.stringify(complianceData));

      // Post Audit Log entry
      await fetch('/api/audit-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'SETTINGS_SAVED',
          description: 'Updated system preferences, clinic profile, and compliance parameters.',
          actor: session?.user?.name || 'Clinic Staff',
        }),
      });

      toast.success('Settings saved and persisted successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings.');
    } finally {
      setLoading(false);
    }
  };

  // Perform secure password update via database
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('All password fields are required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    setUpdatingPassword(true);
    try {
      const res = await fetch('/api/settings/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(data.error || 'Failed to update password.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Connection error while updating password.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  // Reset settings function (QOL)
  const handleResetSettings = async () => {
    if (!confirm('Are you sure you want to restore default clinic settings? This will clear locally persisted preferences.')) return;
    
    try {
      localStorage.removeItem('uacap_settings_clinic');
      localStorage.removeItem('uacap_settings_preferences');
      localStorage.removeItem('uacap_settings_compliance');

      setClinicName('University of the Assumption Clinic');
      setPhilhealthPan('H987654321');
      setAddress('San Fernando, Pampanga');
      setContactNumber('+63 912 345 6789');
      setEmail('clinic@ua.edu.ph');
      setNotificationsEnabled(true);
      setDarkModeEnabled(false);
      setSessionTimeout('30 Minutes');
      setDataRetention('5 Years (Standard)');

      document.documentElement.classList.remove('dark');

      await fetch('/api/audit-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'SETTINGS_RESET',
          description: 'Restored default clinic profile and system preferences.',
          actor: session?.user?.name || 'Clinic Staff',
        }),
      });

      toast.success('Settings restored to system defaults.');
    } catch (e) {
      toast.error('Failed to reset settings.');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-slate-800 to-slate-950">
            <SettingsIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
            <p className="text-sm text-gray-500">Configure clinic profile, security, and PhilHealth compliance.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleResetSettings} 
            className="btn-secondary flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          >
            <Trash2 className="w-4 h-4" />
            Reset Defaults
          </button>
          <button 
            onClick={handleSave} 
            disabled={loading} 
            className="btn-primary flex items-center gap-2" 
            style={{ background: '#004B87' }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
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
                  ? 'bg-blue-50 text-blue-700 border border-blue-100 dark:bg-slate-850 dark:text-blue-400 dark:border-slate-800' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800/40 dark:hover:text-slate-100'
              }`}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 card-glass p-6 md:p-8 min-h-[500px]">
          
          {/* Clinic Profile */}
          {activeTab === 'clinic' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-lg font-bold text-gray-900 border-b pb-2 dark:border-slate-800">Clinic Profile</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Institution Name</label>
                  <input 
                    type="text" 
                    value={clinicName} 
                    onChange={e => setClinicName(e.target.value)}
                    className="form-input" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">PhilHealth PAN</label>
                  <input 
                    type="text" 
                    value={philhealthPan} 
                    onChange={e => setPhilhealthPan(e.target.value)}
                    className="form-input font-mono" 
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Address</label>
                  <input 
                    type="text" 
                    value={address} 
                    onChange={e => setAddress(e.target.value)}
                    className="form-input" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Contact Number</label>
                  <input 
                    type="text" 
                    value={contactNumber} 
                    onChange={e => setContactNumber(e.target.value)}
                    className="form-input" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email Address</label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)}
                    className="form-input" 
                  />
                </div>
              </div>
            </div>
          )}

          {/* Preferences */}
          {activeTab === 'preferences' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-lg font-bold text-gray-900 border-b pb-2 dark:border-slate-800">System Preferences</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-xl bg-gray-50/50 dark:border-slate-800 dark:bg-slate-950/40">
                  <div>
                    <h3 className="font-semibold text-gray-900">Push Notifications</h3>
                    <p className="text-xs text-gray-500">Receive alerts for new triage entries and stock warnings.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={notificationsEnabled} 
                      onChange={e => setNotificationsEnabled(e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:bg-slate-800"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-xl bg-gray-50/50 dark:border-slate-800 dark:bg-slate-950/40">
                  <div>
                    <h3 className="font-semibold text-gray-900">Dark Mode</h3>
                    <p className="text-xs text-gray-500">Enable dark theme for the entire application.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={darkModeEnabled} 
                      onChange={e => handleDarkModeToggle(e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:bg-slate-800"></div>
                  </label>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 mt-4">Session Timeout</label>
                  <select 
                    value={sessionTimeout} 
                    onChange={e => setSessionTimeout(e.target.value)}
                    className="form-input w-full md:w-64"
                  >
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
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-lg font-bold text-gray-900 border-b pb-2 dark:border-slate-800">Security & Access</h2>
              
              <form onSubmit={handlePasswordChange} className="p-5 border rounded-xl space-y-4 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2 dark:text-slate-100">
                  <Key className="w-4 h-4 text-blue-600" /> Change Account Password
                </h3>
                <div className="grid grid-cols-1 gap-4 max-w-md">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Current Password</label>
                    <input 
                      type="password" 
                      placeholder="Enter current password" 
                      value={currentPassword} 
                      onChange={e => setCurrentPassword(e.target.value)}
                      className="form-input" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">New Password</label>
                    <input 
                      type="password" 
                      placeholder="Minimum 6 characters" 
                      value={newPassword} 
                      onChange={e => setNewPassword(e.target.value)}
                      className="form-input" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Confirm New Password</label>
                    <input 
                      type="password" 
                      placeholder="Repeat new password" 
                      value={confirmPassword} 
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="form-input" 
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={updatingPassword}
                    className="btn-primary w-fit justify-center"
                    style={{ background: '#004B87' }}
                  >
                    {updatingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Compliance */}
          {activeTab === 'compliance' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-lg font-bold text-gray-900 border-b pb-2 flex items-center gap-2 dark:border-slate-800">
                <CheckCircle className="w-5 h-5 text-emerald-500" /> PhilHealth Circular 2024-0013
              </h2>
              <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
                <p>The UACAP system is natively configured to comply with the <strong className="text-gray-900">PhilHealth Circular No. 2024-0013</strong> documentation standards. This includes mandatory structural encoding for FPE (First Patient Encounter) and SOAP consultations.</p>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 dark:bg-emerald-950/20 dark:border-emerald-900/30">
                  <h3 className="font-semibold text-emerald-900 mb-2 dark:text-emerald-400">Active Compliance Modules:</h3>
                  <ul className="list-disc pl-5 space-y-1 text-emerald-800 dark:text-emerald-300">
                    <li>Strict ICD-10 Coding validations</li>
                    <li>e-Prescription generation with generic name mandates</li>
                    <li>Referral capability logs and audit trails</li>
                    <li>XML schema generation mapping for batch transmittals</li>
                  </ul>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 mt-4">Data Retention Policy</label>
                  <select 
                    value={dataRetention} 
                    onChange={e => setDataRetention(e.target.value)}
                    className="form-input w-full md:w-64"
                  >
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
