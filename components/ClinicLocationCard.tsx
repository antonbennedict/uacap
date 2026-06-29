'use client';

import type { Clinic } from '@/lib/types';
import { MapPin, Clock, Phone, Mail, CheckCircle, ExternalLink } from 'lucide-react';

interface ClinicLocationCardProps {
  clinic: Clinic;
}

export default function ClinicLocationCard({ clinic }: ClinicLocationCardProps) {
  const mapsUrl = `https://www.openstreetmap.org/?mlat=${clinic.latitude}&mlon=${clinic.longitude}&zoom=16`;
  const iframeSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${clinic.longitude - 0.01}%2C${clinic.latitude - 0.008}%2C${clinic.longitude + 0.01}%2C${clinic.latitude + 0.008}&layer=mapnik&marker=${clinic.latitude}%2C${clinic.longitude}`;

  return (
    <div className="card-glass animate-fade-in overflow-hidden">
      {/* Header strip */}
      <div className="h-2 bg-gradient-to-r from-philgreen to-emerald-400" />

      <div className="p-6">
        {/* Clinic name & accreditation */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 leading-tight">{clinic.name}</h3>
            <p className="text-xs font-mono text-gray-400 mt-1">{clinic.phicCode}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="badge badge-green">
              <CheckCircle className="w-3 h-3" />
              PhilHealth Accredited
            </span>
          </div>
        </div>

        {/* Address */}
        <div className="flex items-start gap-2 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
          <MapPin className="w-4 h-4 text-philgreen mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-800">{clinic.address}</p>
            <p className="text-sm text-gray-600">
              {clinic.city}, {clinic.province} {clinic.zipCode}
            </p>
            <p className="text-xs text-gray-400 mt-1 font-mono">
              {clinic.latitude.toFixed(4)}°N, {clinic.longitude.toFixed(4)}°E
            </p>
          </div>
        </div>

        {/* Contact info */}
        <div className="grid grid-cols-1 gap-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span>{clinic.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span>{clinic.email}</span>
          </div>
        </div>

        {/* Operating hours */}
        <div className="mb-4 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-gray-700">Operating Hours</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500 font-medium">Mon–Fri</span>
              <span className="text-gray-700">{clinic.operatingHours.weekdays}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500 font-medium">Saturday</span>
              <span className="text-gray-700">{clinic.operatingHours.saturday}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500 font-medium">Sunday</span>
              <span className="text-gray-700">{clinic.operatingHours.sunday}</span>
            </div>
          </div>
        </div>

        {/* OpenStreetMap embed */}
        <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm relative">
          <iframe
            src={iframeSrc}
            width="100%"
            height="220"
            style={{ border: 0 }}
            loading="lazy"
            title={`Map of ${clinic.name}`}
          />
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 bg-white rounded-md shadow text-xs font-medium text-gray-600 hover:text-philgreen border border-gray-200 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            View larger map
          </a>
        </div>
      </div>
    </div>
  );
}
