'use client';

import { forwardRef } from 'react';
import type { Prescription, Clinic, Member } from '@/lib/types';
import { formatDate, formatDateTime, formatCurrency } from '@/lib/utils';

interface PrescriptionSlipProps {
  prescription: Prescription;
  clinic: Clinic;
  member: Member;
}

const PrescriptionSlip = forwardRef<HTMLDivElement, PrescriptionSlipProps>(
  ({ prescription, clinic, member }, ref) => {
    const fullName = `${member.firstName} ${member.middleName || ''} ${member.lastName}${member.extension ? ` ${member.extension}` : ''}`;

    return (
      <div
        ref={ref}
        className="bg-white text-gray-900"
        style={{
          fontFamily: "'Times New Roman', serif",
          width: '210mm',
          minHeight: '297mm',
          padding: '20mm 25mm',
          boxSizing: 'border-box',
        }}
      >
        {/* Clinic Header */}
        <div style={{ borderBottom: '3px double #00843D', paddingBottom: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
                    backgroundColor: '#00843D',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>♥</span>
                </div>
                <div>
                  <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0A1628', margin: 0, lineHeight: 1.2 }}>
                    {clinic.name}
                  </h1>
                  <p style={{ fontSize: '11px', color: '#666', margin: 0, marginTop: '2px' }}>
                    PhilHealth Accredited Outpatient Clinic · {clinic.phicCode}
                  </p>
                </div>
              </div>
              <p style={{ fontSize: '11px', color: '#555', margin: '4px 0 0 0' }}>
                {clinic.address}, {clinic.city}, {clinic.province} {clinic.zipCode}
              </p>
              <p style={{ fontSize: '11px', color: '#555', margin: '2px 0 0 0' }}>
                Tel: {clinic.phone} · Email: {clinic.email}
              </p>
            </div>
            <div style={{ textAlign: 'right', minWidth: '140px' }}>
              <div style={{ border: '1px solid #00843D', borderRadius: '6px', padding: '8px 12px', display: 'inline-block' }}>
                <p style={{ fontSize: '9px', color: '#00843D', fontWeight: 'bold', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Prescription No.
                </p>
                <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#0A1628', margin: '2px 0 0 0', fontFamily: 'monospace' }}>
                  {prescription.prescriptionNumber}
                </p>
              </div>
              <p style={{ fontSize: '10px', color: '#888', marginTop: '6px' }}>
                Date: {formatDate(prescription.createdAt)}
              </p>
              {prescription.finalizedAt && (
                <p style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>
                  Finalized: {formatDateTime(prescription.finalizedAt)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Patient Info Block */}
        <div
          style={{
            backgroundColor: '#f8fffe',
            border: '1px solid #d1fae5',
            borderRadius: '6px',
            padding: '12px 16px',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <p style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 2px 0' }}>Patient Name</p>
              <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#0A1628', margin: 0 }}>{fullName}</p>
            </div>
            <div>
              <p style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 2px 0' }}>PhilHealth PIN</p>
              <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#00843D', margin: 0, fontFamily: 'monospace' }}>
                {member.philhealthPin}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 2px 0' }}>Age / Sex</p>
              <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#0A1628', margin: 0 }}>
                {new Date().getFullYear() - new Date(member.dateOfBirth).getFullYear()} yrs / {member.sex}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 2px 0' }}>Address</p>
              <p style={{ fontSize: '11px', color: '#333', margin: 0 }}>{member.barangay}{member.barangay && member.cityMunicipality ? ', ' : ''}{member.cityMunicipality || 'Not provided'}</p>
            </div>
            <div>
              <p style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 2px 0' }}>Membership Type</p>
              <p style={{ fontSize: '11px', color: '#333', margin: 0 }}>{member.clientType}</p>
            </div>
            {prescription.diagnosis && (
              <div>
                <p style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 2px 0' }}>Diagnosis</p>
                <p style={{ fontSize: '11px', color: '#333', margin: 0 }}>{prescription.diagnosis}</p>
              </div>
            )}
          </div>
        </div>

        {/* Rx Symbol & Medicines */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '12px' }}>
            <span
              style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: '#00843D',
                lineHeight: 1,
                fontFamily: 'serif',
              }}
            >
              Rx
            </span>
            <span style={{ fontSize: '11px', color: '#888', fontStyle: 'italic' }}>
              PhilHealth GAMOT / YAKAP Formulary
            </span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ backgroundColor: '#0A1628', color: 'white' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>#</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Generic Name (Brand)</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Form / Strength</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: '600', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Qty</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dosage Instructions</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '600', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {prescription.items.map((item, idx) => (
                <tr
                  key={idx}
                  style={{ backgroundColor: idx % 2 === 0 ? '#f9fafb' : 'white', borderBottom: '1px solid #e5e7eb' }}
                >
                  <td style={{ padding: '10px 12px', color: '#888' }}>{idx + 1}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <p style={{ fontWeight: 'bold', color: '#0A1628', margin: 0, fontSize: '12px' }}>
                      {item.genericName}
                    </p>
                    <p style={{ color: '#666', margin: '2px 0 0 0', fontStyle: 'italic', fontSize: '10px' }}>
                      ({item.brandName})
                    </p>
                  </td>
                  <td style={{ padding: '10px 12px', color: '#555' }}>
                    {item.dosageForm} · {item.strength}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 'bold', color: '#0A1628', fontSize: '14px' }}>
                    {item.quantity}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#555', fontStyle: 'italic', maxWidth: '200px' }}>
                    {item.dosageInstructions}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '600', color: '#00843D' }}>
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid #0A1628', backgroundColor: '#f0faf5' }}>
                <td colSpan={5} style={{ padding: '10px 12px', fontWeight: 'bold', color: '#0A1628', fontSize: '12px', textAlign: 'right' }}>
                  Total Amount (YAKAP-Covered):
                </td>
                <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#00843D', fontSize: '14px', textAlign: 'right' }}>
                  {formatCurrency(prescription.totalAmount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Notes */}
        {prescription.notes && (
          <div style={{ borderLeft: '3px solid #00843D', paddingLeft: '12px', marginBottom: '20px' }}>
            <p style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px 0' }}>Notes:</p>
            <p style={{ fontSize: '11px', color: '#555', fontStyle: 'italic', margin: 0 }}>{prescription.notes}</p>
          </div>
        )}

        {/* Signature block */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginTop: '40px',
            paddingTop: '20px',
            borderTop: '1px dashed #ccc',
          }}
        >
          <div style={{ fontSize: '10px', color: '#888' }}>
            <p style={{ margin: 0 }}>PhilHealth Member Copy</p>
            <p style={{ margin: '2px 0 0 0' }}>GAMOT / YAKAP Program</p>
            <p style={{ margin: '2px 0 0 0', fontFamily: 'monospace' }}>
              Rx: {prescription.prescriptionNumber}
            </p>
          </div>
          <div style={{ textAlign: 'center', minWidth: '200px' }}>
            <div style={{ borderBottom: '1.5px solid #0A1628', marginBottom: '6px', height: '48px' }} />
            <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#0A1628', margin: 0 }}>
              {prescription.physicianName}
            </p>
            <p style={{ fontSize: '10px', color: '#888', margin: '2px 0 0 0' }}>
              PRC License No: {prescription.physicianLicense}
            </p>
            <p style={{ fontSize: '10px', color: '#888', margin: '2px 0 0 0' }}>Attending Physician</p>
          </div>
          <div style={{ textAlign: 'right', fontSize: '10px', color: '#888' }}>
            <p style={{ margin: 0 }}>Date Dispensed: _______________</p>
            <p style={{ margin: '6px 0 0 0' }}>Pharmacist Signature: _______________</p>
            <p style={{ margin: '6px 0 0 0' }}>PRC License No: _______________</p>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: '24px',
            paddingTop: '12px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <p style={{ fontSize: '9px', color: '#bbb', margin: 0 }}>
            This prescription is valid for 7 days from date of issuance. PhilHealth GAMOT medicines are dispensed exclusively to registered beneficiaries.
          </p>
          <p style={{ fontSize: '9px', color: '#bbb', margin: 0, whiteSpace: 'nowrap', marginLeft: '16px' }}>
            © {new Date().getFullYear()} Philippine Health Insurance Corporation
          </p>
        </div>
      </div>
    );
  }
);

PrescriptionSlip.displayName = 'PrescriptionSlip';
export default PrescriptionSlip;
