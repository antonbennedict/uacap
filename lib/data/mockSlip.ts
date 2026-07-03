export interface MockSlip {
  name: string;
  philhealthPin: string;
  dateOfBirth: string;
  sex: string;
  civilStatus: string;
  membershipType: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  province: string;
  zipCode: string;
  clinic: string;
  accreditationNo: string;
  yesTransactionNo: string;
  yesDateSubmitted: string;
  dateGenerated: string;
  copaymentCap: number;
  annualAllocation: number;
  availedAmount: number;
  remainingBalance: number;
}

export const mockSlip: MockSlip = {
  name: "GARCIA, ANA BAUTISTA",
  philhealthPin: "03-456789012-3",
  dateOfBirth: "1992-12-01",
  sex: "Female",
  civilStatus: "Single",
  membershipType: "Employed",
  phone: "09391234567",
  email: "ana.garcia@ateneo.edu.ph",
  address: "789 Katipunan Ave., Brgy. Loyola Heights",
  city: "Quezon City",
  province: "Metro Manila",
  zipCode: "1108",
  clinic: "UNIVERSITY OF THE ASSUMPTION, INC.",
  accreditationNo: "P03037699",
  yesTransactionNo: "YES-2026-964543",
  yesDateSubmitted: "2026-07-02T14:43:00+08:00",
  dateGenerated: "2026-07-02T14:47:00+08:00",
  copaymentCap: 900,
  annualAllocation: 10000,
  availedAmount: 5000,
  remainingBalance: 5000
};
