-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Clinic Staff',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "philhealthPin" TEXT NOT NULL,
    "packageType" TEXT NOT NULL DEFAULT 'KONSULTA',
    "hasConsent" BOOLEAN NOT NULL DEFAULT false,
    "clientType" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "extension" TEXT,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "sex" TEXT NOT NULL,
    "mobileNumber" TEXT,
    "landlineNumber" TEXT,
    "barangay" TEXT,
    "cityMunicipality" TEXT,
    "province" TEXT,
    "memberType" TEXT,
    "department" TEXT,
    "idNumber" TEXT,
    "enrollmentStatus" TEXT DEFAULT 'Active',
    "sponsorPin" TEXT,
    "sponsorLastName" TEXT,
    "sponsorFirstName" TEXT,
    "sponsorMiddleName" TEXT,
    "sponsorExtension" TEXT,
    "sponsorDateOfBirth" TIMESTAMP(3),
    "sponsorSex" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EligibilityCheck" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "trackingCode" TEXT,
    "checkedBy" TEXT NOT NULL,

    CONSTRAINT "EligibilityCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TriageEntry" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "arrivalTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chiefComplaint" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "assignedPhysician" TEXT,

    CONSTRAINT "TriageEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FpeRecord" (
    "id" TEXT NOT NULL,
    "caseNo" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "encounterDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectivityYear" INTEGER NOT NULL DEFAULT 2026,
    "medicalSurgicalHistory" JSONB NOT NULL,
    "familyPersonalHistory" JSONB NOT NULL,
    "immunizations" JSONB NOT NULL,
    "obGyneHistory" JSONB,
    "vitalsAndPhysicals" JSONB NOT NULL,
    "ncdHighRiskAssessment" JSONB NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "fpeTrancheUnlocked" BOOLEAN NOT NULL DEFAULT false,
    "initialTrancheAmount" DOUBLE PRECISION NOT NULL DEFAULT 680.00,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "transmittalId" TEXT,

    CONSTRAINT "FpeRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoapNote" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "visitDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subjective" JSONB NOT NULL,
    "objective" JSONB NOT NULL,
    "assessment" JSONB NOT NULL,
    "planManagement" JSONB NOT NULL,
    "physicianName" TEXT NOT NULL,
    "isYearEndCompliant" BOOLEAN NOT NULL DEFAULT false,
    "satisfactionScore" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Draft',

    CONSTRAINT "SoapNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prescription" (
    "id" TEXT NOT NULL,
    "transactionNumber" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "consultationDate" TIMESTAMP(3) NOT NULL,
    "prescribingPhysician" TEXT NOT NULL,
    "isDispensed" BOOLEAN NOT NULL DEFAULT false,
    "dispensingPersonnel" TEXT,
    "dispenseDate" TIMESTAMP(3),
    "items" JSONB NOT NULL,
    "satisfactionScore" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Draft',

    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabResult" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "testType" TEXT NOT NULL,
    "requestedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resultDate" TIMESTAMP(3),
    "findings" JSONB NOT NULL,
    "narrative" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "encodedBy" TEXT NOT NULL,

    CONSTRAINT "LabResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transmittal" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "fpeCount" INTEGER NOT NULL DEFAULT 0,
    "prescriptionCount" INTEGER NOT NULL DEFAULT 0,
    "soapCount" INTEGER NOT NULL DEFAULT 0,
    "labCount" INTEGER NOT NULL DEFAULT 0,
    "dispatchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actor" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Dispatched',

    CONSTRAINT "Transmittal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Medicine" (
    "id" TEXT NOT NULL,
    "genericName" TEXT NOT NULL,
    "salt" TEXT,
    "strength" TEXT,
    "dosageForm" TEXT,
    "unit" TEXT,
    "package" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "actualUnitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "stockStatus" TEXT NOT NULL DEFAULT 'Adequate',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Medicine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Member_philhealthPin_key" ON "Member"("philhealthPin");

-- CreateIndex
CREATE UNIQUE INDEX "FpeRecord_caseNo_key" ON "FpeRecord"("caseNo");

-- CreateIndex
CREATE UNIQUE INDEX "Prescription_transactionNumber_key" ON "Prescription"("transactionNumber");

-- AddForeignKey
ALTER TABLE "EligibilityCheck" ADD CONSTRAINT "EligibilityCheck_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TriageEntry" ADD CONSTRAINT "TriageEntry_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FpeRecord" ADD CONSTRAINT "FpeRecord_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FpeRecord" ADD CONSTRAINT "FpeRecord_transmittalId_fkey" FOREIGN KEY ("transmittalId") REFERENCES "Transmittal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoapNote" ADD CONSTRAINT "SoapNote_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabResult" ADD CONSTRAINT "LabResult_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
