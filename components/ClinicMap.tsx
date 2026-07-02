'use client';

import { useState, useEffect } from 'react';
import { MapPin, Building } from 'lucide-react';

export default function ClinicMap() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-64 bg-slate-50 animate-pulse rounded-xl flex items-center justify-center border border-slate-200">
        <MapPin className="w-8 h-8 text-slate-300" />
      </div>
    );
  }

  return (
    <div className="card-glass overflow-hidden border border-slate-200 mt-6 shadow-sm">
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-philgreen/10 flex items-center justify-center">
          <Building className="w-4 h-4 text-philgreen" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800">University of the Assumption</h3>
          <p className="text-xs text-slate-500 font-medium">HCI Code: H0354012 • San Fernando, Pampanga</p>
        </div>
      </div>
      <div className="relative w-full h-[300px] bg-slate-100 group">
        <iframe
          title="Clinic Location Map"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src="https://www.openstreetmap.org/export/embed.html?bbox=120.6922,15.0319,120.7022,15.0419&layer=mapnik&marker=15.0369,120.6972"
          className="absolute inset-0 grayscale-[20%] contrast-[1.1] opacity-90 group-hover:opacity-100 transition-opacity duration-500"
        />
        {/* Custom interactive overlay to make it look premium */}
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-lg border border-slate-100 flex items-center gap-2 pointer-events-none">
          <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
            <MapPin className="w-3.5 h-3.5 text-philgreen animate-bounce" />
          </div>
          <span className="text-xs font-bold text-slate-700 tracking-wide uppercase">Active Clinic</span>
        </div>
      </div>
    </div>
  );
}
