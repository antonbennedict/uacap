# UACAP — Project Context & Architecture

> **UACAP: An Integrated Health Information Management System with PhilHealth YAKAP Integration for University Healthcare Services**
>
> A capstone project presented to the Faculty of the Information Technology Department, College of Information Technology, University of the Assumption, in partial fulfillment of the requirements for the degree of Bachelor of Science in Information Technology.
>
> **Authors:** Alonzo, Amaro Juno D. · Galang, Bryan Oliver M. · Lulu, Anton Bennedict C.
>
> **Date:** 23 June 2026

---

## 1. Executive Summary

UACAP is a web-based Electronic Medical Record (EMR) and clinic management system designed for the University Clinic of the University of the Assumption in San Fernando, Pampanga. It centralizes patient records, clinical documentation, medicine inventory, and PhilHealth YAKAP compliance workflows into a single platform.

The system was developed in response to **PhilHealth Advisory No. 2025-0077**, which mandated the permanent decommissioning of the eKonsulta (eKon) platform effective July 1, 2026, requiring all YAKAP-accredited healthcare providers to transition to PhilHealth-certified EMR systems. UACAP replaces the clinic's legacy Microsoft Excel-based recordkeeping and fragmented eKonsulta data encoding workflow.

### Core Objectives

1. Centralize patient health records, clinical encounters, and PhilHealth reporting in a single platform.
2. Support electronic FPE (First Patient Encounter) encoding, SOAP-based consultations, laboratory results, and prescription management.
3. Enable direct transmittal and dispatch of YAKAP transaction data to PhilHealth (PHIC).
4. Provide medicine/supply inventory monitoring (GAMOT Formulary).
5. Comply with **RA 11223** (Universal Health Care Act), **RA 10173** (Data Privacy Act), and PhilHealth YAKAP program guidelines.

### Regulatory Alignment

| Regulation | Relevance |
|---|---|
| **RA 11223** (Universal Health Care Act) | Mandates interoperable health information systems and electronic health records |
| **RA 10173** (Data Privacy Act of 2012) | Classifies health information as sensitive personal data; requires security safeguards |
| **PhilHealth Advisory No. 2025-0077** | Mandates EMR adoption for YAKAP providers; decommissions eKonsulta |
| **UN SDG 3** (Good Health & Well-Being) | Improves healthcare service delivery efficiency |
| **UN SDG 9** (Industry, Innovation, Infrastructure) | Strengthens digital health infrastructure |

### Scope & Delimitations

- **In scope:** Patient registration, EMR, clinical encounter documentation, SOAP recording, ICD-10 coding, prescription management, lab results, inventory monitoring, PhilHealth YAKAP data management, capitation monitoring, audit logging, Excel-to-database migration.
- **Out of scope:** Patient-facing mobile app (separate capstone project — UACAP provides API services only), telemedicine, video consultations, billing/POS, insurance claims beyond YAKAP, official PhilHealth CSP certification.

---

## 2. Technical Stack

| Layer | Technology | Version |
|---|---|---|
| **Runtime** | Node.js | Latest LTS |
| **Framework** | Next.js (App Router) | `^15.2.0` (currently 15.5.20) |
| **UI Library** | React | `^19.0.0` |
| **Language** | TypeScript | `^5.x` (strict mode) |
| **Styling** | Tailwind CSS | `^3.4.1` |
| **Database** | PostgreSQL | 16+ (localhost:5432) |
| **ORM** | Prisma | `^6.1.0` (currently 6.19.3) |
| **State Management** | Zustand | `^4.5.4` |
| **Authentication** | NextAuth.js | `^4.24.7` (CredentialsProvider + JWT) |
| **Password Hashing** | bcryptjs | `^3.0.3` |
| **UI Primitives** | Radix UI | Collapsible, Dialog, Dropdown, Label, ScrollArea, Select, Separator, Slot, Tabs, Toast |
| **Icons** | Lucide React | `^0.470.0` |
| **Notifications** | Sonner | `^1.5.0` |
| **Date Utilities** | date-fns | `^3.6.0` |
| **Print** | react-to-print | `^2.15.1` |
| **CSS Utilities** | clsx, tailwind-merge, class-variance-authority | Latest |
| **Fonts** | Google Fonts (Inter + JetBrains Mono) | Via CSS import |

### Environment Variables (`.env`)

```env
DATABASE_URL="postgresql://postgres:admin@localhost:5432/uacap_db?schema=public"
DIRECT_URL="postgresql://postgres:admin@localhost:5432/uacap_db?schema=public"
NEXTAUTH_SECRET="<required-for-production>"
NEXTAUTH_URL="http://localhost:3000"
```

> [!IMPORTANT]
> `NEXTAUTH_SECRET` must be set to a secure random string in production. Generate one with `openssl rand -base64 32`.

---

## 3. Project Structure

```
uacap/
├── .env                                    # Environment variables
├── .eslintrc.json                          # ESLint configuration
├── .gitignore                              # Git ignore rules
├── CONTEXT.md                              # This file — project documentation
├── next.config.js                          # Next.js configuration
├── next-env.d.ts                           # Next.js TypeScript declarations
├── package.json                            # Dependencies & scripts
├── postcss.config.js                       # PostCSS configuration
├── tailwind.config.js                      # Tailwind CSS theme & plugins
├── tsconfig.json                           # TypeScript compiler options
├── sampledata.csv                          # 20-row sample CSV for bulk import testing
│
├── prisma/
│   ├── schema.prisma                       # Database schema (10 models)
│   ├── seed.ts                             # Database seeding script
│   └── migrations/
│       └── 20260702124316_init_v2/         # Current baseline migration
│           └── migration.sql
│
├── lib/
│   ├── prisma.ts                           # Prisma Client singleton (global pattern)
│   ├── store.ts                            # Zustand store (API client layer)
│   ├── types.ts                            # TypeScript interfaces & type aliases
│   └── utils.ts                            # Utility functions (formatting, cn, etc.)
│
├── components/
│   ├── AuditLog.tsx                        # Audit log viewer with pagination & filters
│   ├── ClinicLocationCard.tsx              # Clinic info card with map embed
│   ├── MedicineTable.tsx                   # GAMOT inventory table with search/filter
│   ├── MemberCard.tsx                      # Patient profile card component
│   ├── PrescriptionSlip.tsx                # Print-ready A4 prescription slip
│   ├── Providers.tsx                       # NextAuth SessionProvider wrapper
│   └── Sidebar.tsx                         # Main navigation sidebar
│
└── app/
    ├── globals.css                         # Global CSS design system
    ├── layout.tsx                          # Root HTML layout
    ├── page.tsx                            # Root redirect → /login
    │
    ├── login/
    │   └── page.tsx                        # Authentication page
    │
    ├── empanelment-slip/
    │   └── page.tsx                        # Standalone printable YES Slip
    │
    ├── (portal)/                           # Authenticated layout group
    │   ├── layout.tsx                      # Sidebar + main content wrapper
    │   ├── dashboard/page.tsx              # OPD Dashboard & metrics
    │   ├── eligibility/page.tsx            # Benefit Eligibility (PBEF)
    │   ├── empanelment/page.tsx            # YAKAP Empanelment Wizard
    │   ├── fpe/page.tsx                    # FPE Encoding (7-Step HSA Wizard)
    │   ├── consultation/page.tsx           # YAKAP Consultation (SOAP Notes)
    │   ├── lab-results/page.tsx            # Lab Results Encoding
    │   ├── gamot/page.tsx                  # GAMOT Formulary (medicine inventory)
    │   ├── masterlist/page.tsx             # Masterlist CSV Import
    │   ├── prescription-builder/page.tsx   # Electronic Prescription Builder
    │   ├── settings/page.tsx               # System Settings & Bulk CSV Import
    │   └── transmittal/page.tsx            # Direct PHIC Dispatch
    │
    └── api/
        ├── auth/[...nextauth]/route.ts     # NextAuth authentication endpoint
        ├── dashboard/metrics/route.ts      # Dashboard aggregation metrics
        ├── members/route.ts                # Member CRUD with relation includes
        ├── members/import/route.ts         # Bulk member createMany
        ├── hsa/save/route.ts               # FPE record creation (HSA wizard)
        ├── consultations/soap/route.ts     # SOAP note creation
        ├── medicines/route.ts              # Medicine inventory (GET/PATCH)
        ├── prescriptions/route.ts          # Prescriptions (GET/POST)
        ├── audit-log/route.ts              # Audit log (GET/POST)
        └── settings/bulk-import/route.ts   # CSV bulk import with validation
```

---

## 4. Database Schema (Prisma)

The database runs on PostgreSQL (`uacap_db`) and is managed through Prisma ORM. All models follow **PascalCase** naming to produce standard **camelCase** Prisma client delegates.

### Entity-Relationship Diagram

```mermaid
erDiagram
    User {
        String id PK
        String username UK
        String email UK
        String passwordHash
        String name
        String role
        DateTime createdAt
        DateTime updatedAt
    }

    Member {
        String id PK
        String philhealthPin UK
        String packageType
        Boolean hasConsent
        String clientType
        String lastName
        String firstName
        String middleName
        String extension
        DateTime dateOfBirth
        String sex
        String mobileNumber
        String landlineNumber
        String sponsorPin
        String sponsorLastName
        String sponsorFirstName
        String sponsorMiddleName
        String sponsorExtension
        DateTime sponsorDateOfBirth
        String sponsorSex
    }

    EligibilityCheck {
        String id PK
        String memberId FK
        DateTime checkedAt
        String status
        String trackingCode
        String checkedBy
    }

    TriageEntry {
        String id PK
        String memberId FK
        String clinicId
        DateTime arrivalTime
        String chiefComplaint
        String status
        String priority
        String assignedPhysician
    }

    FpeRecord {
        String id PK
        String caseNo UK
        String memberId FK
        DateTime encounterDate
        Int effectivityYear
        Json medicalSurgicalHistory
        Json familyPersonalHistory
        Json immunizations
        Json obGyneHistory
        Json vitalsAndPhysicals
        Json ncdHighRiskAssessment
        String riskLevel
        Boolean fpeTrancheUnlocked
        String status
        String transmittalId FK
    }

    SoapNote {
        String id PK
        String memberId FK
        DateTime visitDate
        Json subjective
        Json objective
        Json assessment
        Json planManagement
        String physicianName
        Boolean isYearEndCompliant
        String status
    }

    Prescription {
        String id PK
        String transactionNumber UK
        String memberId FK
        DateTime consultationDate
        String prescribingPhysician
        Boolean isDispensed
        String dispensingPersonnel
        DateTime dispenseDate
        Json items
        String status
    }

    LabResult {
        String id PK
        String memberId FK
        String clinicId
        String testType
        DateTime requestedDate
        DateTime resultDate
        Json findings
        String narrative
        String status
        String encodedBy
    }

    Transmittal {
        String id PK
        String clinicId
        DateTime startDate
        DateTime endDate
        Int fpeCount
        Int prescriptionCount
        Int soapCount
        Int labCount
        DateTime dispatchedAt
        String actor
        String status
    }

    Member ||--o{ EligibilityCheck : "has"
    Member ||--o{ TriageEntry : "has"
    Member ||--o{ FpeRecord : "has"
    Member ||--o{ SoapNote : "has"
    Member ||--o{ Prescription : "has"
    Member ||--o{ LabResult : "has"
    Transmittal ||--o{ FpeRecord : "contains"
```

### Model Summary Table

| Model | Prisma Delegate | Purpose | Cascade Delete |
|---|---|---|---|
| `User` | `prisma.user` | System authentication & RBAC | — |
| `Member` | `prisma.member` | Patient/member registration & demographics | — |
| `EligibilityCheck` | `prisma.eligibilityCheck` | PhilHealth benefit eligibility verification (PBEF) | Yes (from Member) |
| `TriageEntry` | `prisma.triageEntry` | Daily OPD triage queue management | Yes (from Member) |
| `FpeRecord` | `prisma.fpeRecord` | First Patient Encounter — 7-step HSA wizard data | Yes (from Member) |
| `SoapNote` | `prisma.soapNote` | YAKAP consultation SOAP notes | Yes (from Member) |
| `Prescription` | `prisma.prescription` | Electronic prescriptions (GAMOT) | Yes (from Member) |
| `LabResult` | `prisma.labResult` | Laboratory test requests & results | Yes (from Member) |
| `Transmittal` | `prisma.transmittal` | PHIC dispatch batch records | — |

### YAKAP Capitation Logic

The YAKAP program uses a **two-tranche capitation model**:

| Tranche | Trigger | Percentage | Database Field |
|---|---|---|---|
| **First Tranche (40%)** | Completed FPE encoding | 40% of annual allotment | `FpeRecord.fpeTrancheUnlocked = true` |
| **Second Tranche (60%)** | Year-end compliance (≥1 consultation) | 60% of annual allotment | `SoapNote.isYearEndCompliant = true` |

---

## 5. Authentication & Authorization

### Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant LoginPage
    participant NextAuth
    participant PrismaDB

    User->>LoginPage: Enter username + password
    LoginPage->>NextAuth: POST /api/auth/callback/credentials
    NextAuth->>PrismaDB: prisma.user.findUnique({ where: { username } })
    PrismaDB-->>NextAuth: User record (with passwordHash)
    NextAuth->>NextAuth: bcrypt.compare(password, passwordHash)
    NextAuth-->>LoginPage: JWT session token (id, name, email, role)
    LoginPage->>User: Redirect to /dashboard
```

### Default Admin Credentials (Development)

| Field | Value |
|---|---|
| Username | `admin` |
| Password | `admin123` |
| Email | `admin@uacap.edu.ph` |
| Name | PhilHealth Administrator |
| Role | Clinic Admin |

### Role-Based Access Control (RBAC)

The `User.role` field supports the following roles:

| Role | Description |
|---|---|
| `Clinic Admin` | Full system access — manages all modules, users, and settings |
| `Physician` | Clinical access — SOAP consultations, prescriptions, FPE review |
| `Nurse` | Triage management, vitals recording, lab coordination |
| `Encoder` | Data entry — FPE encoding, masterlist imports, transmittal dispatch |
| `Clinic Staff` | Default role — limited read access to patient records |

---

## 6. Application Modules

### Module Map

The application is organized into three navigation groups within the sidebar:

```
┌─────────────────────────────────────────────────────┐
│  PHILCHECK (Verification & Compliance)              │
│  ├── Dashboard (/dashboard)                         │
│  └── Eligibility (/eligibility)                     │
│                                                     │
│  UACAP (Clinical EMR Workflows)                     │
│  ├── Empanelment (/empanelment)                     │
│  ├── FPE Encoding (/fpe)                            │
│  ├── Consultation (/consultation)                   │
│  ├── Lab Results (/lab-results)                      │
│  ├── GAMOT Formulary (/gamot)                       │
│  └── Prescription Builder (/prescription-builder)   │
│                                                     │
│  IMPORT & EXPORT (Data Management)                  │
│  ├── Masterlist (/masterlist)                       │
│  └── Transmittal (/transmittal)                     │
│                                                     │
│  SYSTEM                                             │
│  └── Settings (/settings)                           │
└─────────────────────────────────────────────────────┘
```

### Module Descriptions

#### 1. Dashboard (`/dashboard`)
Aggregated OPD metrics dashboard showing:
- Triage queue counts (Waiting, In-Consult, Done)
- Low stock medicine alerts
- FPE tranche unlock progress
- Year-end compliance tracking
- Member search with quick-access cards
- Data sourced from `/api/dashboard/metrics`

#### 2. Eligibility (`/eligibility`)
PhilHealth Benefit Eligibility Facility (PBEF) check interface:
- Member search and selection
- Eligibility status verification
- Coverage period validation
- Approval code tracking
- Related `EligibilityCheck` records displayed per member

#### 3. Empanelment (`/empanelment`)
YAKAP Empanelment Slip (YES Slip) wizard:
- Multi-step member registration
- PhilHealth PIN validation
- Generates printable YES Slip at `/empanelment-slip`
- Form: PHIC Form YES-1 (2026)

#### 4. FPE Encoding (`/fpe`)
First Patient Encounter — the 7-step Health Service Activity (HSA) wizard:
1. Medical/Surgical History
2. Family & Personal History
3. Immunization Records
4. OB-GYNe History (if applicable)
5. Vitals & Physical Examination
6. NCD High-Risk Assessment
7. Risk Level Classification

- Submits to `/api/hsa/save` (Prisma transaction)
- Validates: member exists + `hasConsent === true`
- Sets `fpeTrancheUnlocked = true` (triggers 40% capitation)

#### 5. Consultation (`/consultation`)
YAKAP Consultation using SOAP methodology:
- **S**ubjective — patient symptoms & history
- **O**bjective — vitals, physical exam findings
- **A**ssessment — diagnosis with ICD-10 coding
- **P**lan — treatment plan & management
- Submits to `/api/consultations/soap` (Prisma)
- Can set `isYearEndCompliant = true` (triggers 60% capitation)

#### 6. Lab Results (`/lab-results`)
Laboratory test management:
- Test types: CBC, Urinalysis, Chest X-Ray, Blood Chemistry, Lipid Profile, Cancer Screening
- Status workflow: Pending → Resulted → Verified
- JSON-based findings storage

#### 7. GAMOT Formulary (`/gamot`)
Medicine inventory management:
- Stock monitoring with status indicators (Adequate / Low / Out of Stock)
- Search & filter by category, status, name
- Inline restock controls
- Stock deduction on prescription finalization

#### 8. Prescription Builder (`/prescription-builder`)
Electronic prescription creation:
- Patient selection (from database via `/api/members`)
- Medicine search from GAMOT formulary
- Dosage instruction entry
- Live stock validation
- Print-ready prescription slip generation (A4)
- Physician selection with PRC license numbers

#### 9. Masterlist (`/masterlist`)
Bulk member import from CSV:
- CSV file parsing and validation
- Duplicate detection by PhilHealth PIN
- Batch database insertion via `/api/members/import`
- Terminal-style progress logging

#### 10. Transmittal (`/transmittal`)
Direct PHIC Dispatch:
- Date range-based transaction batching
- Aggregates FPE, prescription, SOAP, and lab counts
- Dispatch status tracking
- Generates transmittal records

#### 11. Settings (`/settings`)
System administration:
- Bulk CSV data import for testing/QA seeding
- Database population via `/api/settings/bulk-import`
- Row-by-row validation with duplicate checking

---

## 7. API Reference

### Authentication

| Endpoint | Methods | Auth | Backend | Description |
|---|---|---|---|---|
| `/api/auth/[...nextauth]` | GET, POST | Public | Prisma (`User`) + bcrypt | NextAuth CredentialsProvider with JWT strategy |

### Member Management

| Endpoint | Methods | Auth | Backend | Description |
|---|---|---|---|---|
| `/api/members` | GET | Protected | Prisma | Search members by PIN/name (`?q=`). Includes `eligibilityChecks` and latest `fpeRecords` via Prisma relation loading. |
| `/api/members/import` | POST | Protected | Prisma | Bulk `createMany` with `skipDuplicates`. Accepts array of member objects. |

### Clinical Workflows

| Endpoint | Methods | Auth | Backend | Description |
|---|---|---|---|---|
| `/api/hsa/save` | POST | Protected | Prisma (transaction) | Creates `FpeRecord`. Validates member exists + has consent. Auto-sets `fpeTrancheUnlocked: true`. |
| `/api/consultations/soap` | POST | Protected | Prisma | Creates `SoapNote` with status `"Finalized"`. |

### Dashboard & Metrics

| Endpoint | Methods | Auth | Backend | Description |
|---|---|---|---|---|
| `/api/dashboard/metrics` | GET | Protected | Prisma | Aggregates: waiting triage count, active consults, FPE tranche unlocks, year-end compliant SOAPs, dispatched transmittals. |

### Inventory & Prescriptions

| Endpoint | Methods | Auth | Backend | Description |
|---|---|---|---|---|
| `/api/medicines` | GET, PATCH | Protected | In-memory | Medicine inventory. PATCH supports `restock` and `deduct` actions. |
| `/api/prescriptions` | GET, POST | Protected | In-memory | Prescription CRUD. GET supports `?memberPin=` filter. |

### System

| Endpoint | Methods | Auth | Backend | Description |
|---|---|---|---|---|
| `/api/audit-log` | GET, POST | Protected | In-memory | Audit log entries. POST appends entries with server timestamps. |
| `/api/settings/bulk-import` | POST | Protected | Prisma (transaction) | Row-by-row upsert with duplicate checking by `philhealthPin`. Validates required fields. |

---

## 8. State Management (Zustand)

The Zustand store (`lib/store.ts`) serves as a **thin API client layer** that bridges the frontend UI to the backend API routes. It does **not** hold in-memory data arrays — all persistent data is managed server-side via Prisma/PostgreSQL.

### Store Interface

```typescript
interface AppState {
  // Loading & error states
  isLoading: boolean;
  isBulkImporting: boolean;
  error: string | null;

  // Cached server data
  dashboardMetrics: any;

  // Actions (all async — hit API endpoints)
  importMasterlistEntries: (payload: any[]) => Promise<void>;     // POST /api/members/import
  importBulkCSVData: (parsedRows: any[]) => Promise<boolean>;     // POST /api/settings/bulk-import
  fetchDashboardMetrics: () => Promise<void>;                      // GET  /api/dashboard/metrics
  saveFPERecord: (payload: any) => Promise<void>;                  // POST /api/hsa/save
  saveSOAPNote: (payload: any) => Promise<void>;                   // POST /api/consultations/soap
}
```

### Data Flow Pattern

```
UI Component → useAppStore().action() → fetch('/api/...') → API Route → Prisma → PostgreSQL
                                                                    ↓
                                                             JSON Response
                                                                    ↓
                                              fetchDashboardMetrics() → re-render
```

---

## 9. Component Library

| Component | File | Description |
|---|---|---|
| `Providers.tsx` | `components/Providers.tsx` | Root client wrapper — NextAuth `SessionProvider` |
| `Sidebar.tsx` | `components/Sidebar.tsx` | Main navigation sidebar with 3 nav groups, user info, logout, PhilHealth branding |
| `MemberCard.tsx` | `components/MemberCard.tsx` | Patient profile card — demographics, contact, YAKAP benefit progress, dependents list |
| `MedicineTable.tsx` | `components/MedicineTable.tsx` | Paginated medicine inventory table with search, status/category filters, restock controls |
| `AuditLog.tsx` | `components/AuditLog.tsx` | Collapsible audit log viewer with pagination (10/page), filter tabs, action icons |
| `PrescriptionSlip.tsx` | `components/PrescriptionSlip.tsx` | Print-ready A4 prescription slip with `forwardRef` — clinic header, Rx table, signatures |
| `ClinicLocationCard.tsx` | `components/ClinicLocationCard.tsx` | Clinic information card with address, contact, hours, embedded OpenStreetMap |

---

## 10. TypeScript Type System

All types are centralized in `lib/types.ts` (287 lines).

### Type Aliases

| Type | Values |
|---|---|
| `MembershipType` | `'Employed'`, `'Self-Employed'`, `'Voluntary'`, `'Lifetime'`, `'Sponsored'` |
| `MembershipStatus` | `'Active'`, `'Lapsed'`, `'Suspended'` |
| `Sex` | `'Male'`, `'Female'` |
| `CivilStatus` | `'Single'`, `'Married'`, `'Widowed'`, `'Separated'` |
| `DosageForm` | `'Tablet'`, `'Capsule'`, `'Syrup'`, `'Suspension'`, `'Injection'`, `'Cream'`, `'Ointment'`, `'Drops'`, `'Inhaler'`, `'Patch'`, `'Suppository'` |
| `StockStatus` | `'Adequate'`, `'Low'`, `'Out of Stock'` |
| `PrescriptionStatus` | `'Draft'`, `'Finalized'`, `'Cancelled'` |
| `TriageStatus` | `'Waiting'`, `'In-Consult'`, `'Done'`, `'Referred'` |
| `TriagePriority` | `'Urgent'`, `'Normal'`, `'Low'` |
| `LabTestType` | `'CBC'`, `'Urinalysis'`, `'Chest X-Ray'`, `'Blood Chemistry'`, `'Lipid Profile'`, `'Cancer Screening'` |
| `AuditActionType` | `'RESTOCK'`, `'PRESCRIPTION_FINALIZED'`, `'STOCK_DEDUCTED'`, `'LOGIN'`, `'ELIGIBILITY_CHECK'`, `'FPE_ENCODED'`, `'PHIC_DISPATCHED'`, `'TRANSMITTAL_DISPATCHED'`, `'SOAP_FINALIZED'`, `'LAB_RESULTED'`, `'MASTERLIST_IMPORTED'`, `'TRIAGE_UPDATED'` |

### Core Interfaces (17 total)

`TriageEntry`, `SOAPObjective`, `SOAPNote`, `LabResult`, `MasterlistEntry`, `TransmittalRecord`, `FPEVitalSigns`, `FPELifestyle`, `FPERecord`, `Clinic`, `Dependent`, `YakapBenefit`, `Member`, `Medicine`, `PrescriptionItem`, `Prescription`, `AuditLogEntry`

### Utility Functions (`lib/utils.ts`)

| Function | Description |
|---|---|
| `cn(...inputs)` | Tailwind class merger (clsx + tailwind-merge) |
| `formatDate(dateString)` | Format date in `en-PH` locale (e.g., "June 15, 2026") |
| `formatDateTime(dateString)` | Format date+time in `en-PH` locale |
| `formatCurrency(amount)` | Format as PHP currency (₱) |
| `calculateAge(dateOfBirth)` | Calculate age from DOB |
| `generateRxNumber(clinicShortName)` | Generate prescription number (format: `RX-2026-XXXXX-CLINIC`) |

---

## 11. Design System

### Tailwind Theme Extensions

```
Colors:
├── navy (10 shades)     — DEFAULT: #0A1628 (dark sidebar/header)
├── philgreen (10 shades) — DEFAULT: #00843D (PhilHealth green)
└── shadcn/ui HSL variable system (background, foreground, card, popover, etc.)

Fonts:
├── Inter (sans-serif)       — Primary UI typeface
└── JetBrains Mono (monospace) — PIN codes, tracking IDs, code displays

Animations:
├── accordion-down/up
├── fade-in
└── slide-in
```

### Custom CSS Component Classes (`globals.css`)

| Class | Usage |
|---|---|
| `.sidebar` | Main navigation sidebar container |
| `.card-glass` | Glassmorphism card with backdrop blur |
| `.card-stat` | Dashboard metric card |
| `.badge-green/yellow/red/blue/gray` | Status badge variants |
| `.data-table` | Styled table with hover states |
| `.btn-primary` | PhilGreen primary button |
| `.btn-secondary` | Gray secondary button |
| `.btn-danger` | Red destructive button |
| `.form-input` | Consistent form input styling |
| `.scrollbar-thin` | Thin custom scrollbar |
| `.skeleton` | Loading skeleton animation |

---

## 12. Data Migration Status

The project has been migrated from in-memory JSON mock data to a production PostgreSQL + Prisma backend. The migration is **partially complete**:

### Migration Status by Module

| Module | Status | Backend | Notes |
|---|---|---|---|
| Authentication | ✅ Complete | Prisma (`User`) | bcrypt password hashing, JWT sessions |
| Members/Patients | ✅ Complete | Prisma (`Member`) | Full CRUD with relation includes |
| FPE Encoding | ✅ Complete | Prisma (`FpeRecord`) | Transaction-based creation with consent validation |
| SOAP Consultations | ✅ Complete | Prisma (`SoapNote`) | Finalized note creation |
| Dashboard Metrics | ✅ Complete | Prisma (aggregations) | Count-based aggregations across all models |
| Bulk CSV Import | ✅ Complete | Prisma (transaction) | Row-by-row upsert with validation |
| Masterlist Import | ✅ Complete | Prisma (`createMany`) | Batch insert with `skipDuplicates` |
| Eligibility Checks | ✅ Complete | Prisma (`EligibilityCheck`) | Loaded via member relation includes |
| Medicines/GAMOT | ⚠️ In-memory | Empty array `[]` | **Needs Prisma migration** — no Medicine model in schema |
| Prescriptions | ⚠️ In-memory | Empty array `[]` | **Needs Prisma migration** — has model but route uses in-memory |
| Audit Log | ⚠️ In-memory | Empty array `[]` | **Needs Prisma migration** — no AuditLog model in schema |
| Lab Results | ⚠️ Partial | Prisma model exists | Model defined but no dedicated API route |
| Triage | ⚠️ Partial | Prisma model exists | Model defined but no dedicated API route |
| Transmittals | ⚠️ Partial | Prisma model exists | Model defined but no dedicated API route |

---

## 13. Critical Data Flows

### Flow A: Authentication & Session

```
User → /login → POST /api/auth/callback/credentials
  → prisma.user.findUnique({ username })
  → bcrypt.compare(password, passwordHash)
  → JWT token issued (id, name, email, role)
  → Redirect to /dashboard
  → (portal) layout renders Sidebar + page content
```

### Flow B: First Patient Encounter (FPE) Encoding

```
User → /fpe (7-step wizard form)
  → useAppStore().saveFPERecord(payload)
  → POST /api/hsa/save
  → Prisma transaction:
    1. Validate member exists + hasConsent === true
    2. prisma.fpeRecord.create({ ...data, fpeTrancheUnlocked: true })
  → fetchDashboardMetrics() → UI refreshes
  → Audit: "FPE_ENCODED"
```

### Flow C: YAKAP Consultation (SOAP)

```
User → /consultation (SOAP form)
  → useAppStore().saveSOAPNote(payload)
  → POST /api/consultations/soap
  → prisma.soapNote.create({ ...data, status: "Finalized" })
  → fetchDashboardMetrics() → UI refreshes
  → Audit: "SOAP_FINALIZED"
```

### Flow D: Bulk CSV Import

```
User → /settings → Upload CSV file
  → useAppStore().importBulkCSVData(parsedRows)
  → POST /api/settings/bulk-import
  → Prisma transaction (row-by-row):
    1. Validate required fields per row
    2. Check for duplicate philhealthPin
    3. prisma.member.upsert() for each row
  → fetchDashboardMetrics() → UI refreshes
```

### Flow E: Transmittal Dispatch

```
User → /transmittal → Select date range
  → Filter FPE, prescriptions, SOAP notes within range
  → Create transmittal record with counts
  → Update FPE records with transmittalId
  → Audit: "TRANSMITTAL_DISPATCHED"
```

---

## 14. Configuration Reference

### `next.config.js`

```javascript
const nextConfig = {
  async redirects() {
    return [{ source: '/', destination: '/dashboard', permanent: false }]
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ['**/node_modules', 'C:/DumpStack.log.tmp', ...]
      }
    }
    return config;
  }
}
```

### `tsconfig.json`

- **Target:** ES5 | **Module:** ESNext | **JSX:** Preserve
- **Strict mode:** Enabled
- **Path alias:** `@/*` → `./*`

### Prisma Client Singleton (`lib/prisma.ts`)

```typescript
import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => new PrismaClient();

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
```

> [!IMPORTANT]
> Always import from `@/lib/prisma` — never instantiate `new PrismaClient()` directly in API routes or components.

---

## 15. Development Commands

| Command | Description |
|---|---|
| `npm run dev` | Start development server on `http://localhost:3000` |
| `npm run build` | Production build with TypeScript checking |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx prisma generate` | Regenerate Prisma client after schema changes |
| `npx prisma migrate dev --name <name>` | Create and apply a new migration |
| `npx prisma migrate reset --force` | Drop database, re-run all migrations, and seed |
| `npx prisma db push` | Push schema changes without creating migration files |
| `npx prisma db seed` | Run the seed script (`prisma/seed.ts`) |
| `npx prisma studio` | Open Prisma Studio (visual database browser) |

---

## 16. Known Issues & Technical Debt

> [!WARNING]
> The following issues should be addressed before production deployment.

### Critical

1. **Incomplete Database Migration:** The `medicines`, `prescriptions`, and `audit-log` API routes still use in-memory arrays instead of Prisma/PostgreSQL. Data is lost on server restart.
2. **Missing `NEXTAUTH_SECRET`:** The `.env` file does not define `NEXTAUTH_SECRET`, which is required for secure JWT token signing in production.
3. **No Route Protection Middleware:** There is no `middleware.ts` file — all `/(portal)` routes are technically accessible without authentication at the server level.
4. **Broken Component References:** `AuditLog.tsx` and `MedicineTable.tsx` reference Zustand store properties (`auditLog`, `medicines`, `restockMedicine`) that no longer exist in the refactored store.

### Moderate

5. **No Medicine Model in Schema:** The Prisma schema does not include a `Medicine` model. The GAMOT formulary needs a dedicated database table.
6. **No AuditLog Model in Schema:** Audit logging needs a dedicated Prisma model to persist entries.
7. **Missing Lab/Triage API Routes:** The `LabResult` and `TriageEntry` models exist in the schema but have no dedicated CRUD API routes.
8. **Type Misalignment:** The `lib/types.ts` `Member` interface retains legacy fields (`address`, `city`, `province`, `zipCode`, `phone`, `civilStatus`, `membershipType`, `membershipStatus`, `registeredClinicId`, `dependents`, `employer`) that do not exist in the current Prisma `Member` model.
9. **Redirect Conflict:** `next.config.js` redirects `/` → `/dashboard`, but `app/page.tsx` redirects to `/login`. The config redirect fires first.

### Low Priority

10. **Prisma Config Warning:** The `package.json#prisma` configuration property is deprecated and will be removed in Prisma 7. Should migrate to `prisma.config.ts`.
11. **`react-to-print` Peer Dependency:** Version `^2.15.1` has peer dependency warnings with React 19.

---

## 17. Coding Conventions

### Naming Standards

| Entity | Convention | Example |
|---|---|---|
| Prisma Models | PascalCase | `FpeRecord`, `SoapNote`, `EligibilityCheck` |
| Prisma Delegates | camelCase (auto-generated) | `prisma.fpeRecord`, `prisma.soapNote` |
| React Components | PascalCase | `MemberCard`, `PrescriptionSlip` |
| TypeScript Interfaces | PascalCase | `SOAPNote`, `FPERecord`, `Member` |
| API Routes | kebab-case directories | `/api/audit-log`, `/api/bulk-import` |
| CSS Classes | kebab-case | `.card-glass`, `.btn-primary` |
| Utility Functions | camelCase | `formatDate()`, `calculateAge()` |

### Import Patterns

```typescript
// ✅ Prisma client — always use the singleton
import prisma from '@/lib/prisma';

// ✅ Zustand store
import { useAppStore } from '@/lib/store';

// ✅ Types
import type { Member, FPERecord, SOAPNote } from '@/lib/types';

// ✅ Utilities
import { formatDate, formatCurrency, cn } from '@/lib/utils';

// ❌ NEVER instantiate Prisma directly
// import { PrismaClient } from '@prisma/client';
// const prisma = new PrismaClient();
```

### Defensive Coding Patterns

```typescript
// ✅ Always use optional chaining for relation data
member.fpeRecords?.[0]?.effectivityYear ?? new Date().getFullYear()
member.eligibilityChecks?.length ?? 0

// ✅ Always use fallback defaults when destructuring store data
const { fpeRecords = [], triageEntries = [] } = useAppStore();

// ✅ Always guard .filter() / .reduce() on potentially undefined arrays
const waiting = (triageEntries ?? []).filter(t => t.status === 'Waiting').length;
```

---

*Last updated: 2 July 2026 · UACAP v0.1.0*
