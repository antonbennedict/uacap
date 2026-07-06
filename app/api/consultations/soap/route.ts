import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');
    const memberPin = searchParams.get('memberPin');

    if (!memberId && !memberPin) {
      return NextResponse.json({ error: 'memberId or memberPin is required' }, { status: 400 });
    }

    const whereClause: any = {};
    if (memberId) {
      whereClause.memberId = memberId;
    } else if (memberPin) {
      whereClause.member = { philhealthPin: memberPin };
    }

    const rawSoapNotes = await prisma.soapNote.findMany({
      where: whereClause,
      include: {
        member: true,
      },
      orderBy: {
        visitDate: 'desc',
      },
    });

    const soapNotes = rawSoapNotes.map((note) => {
      let subjectiveText = '';
      let rawChiefComplaints: string[] = [];
      let rawOtherComplaint = '';
      let rawHistoryOfIllness = '';
      if (typeof note.subjective === 'string') {
        subjectiveText = note.subjective;
      } else if (note.subjective && typeof note.subjective === 'object') {
        const sub = note.subjective as any;
        subjectiveText = sub.text || '';
        rawChiefComplaints = sub.chiefComplaints || [];
        rawOtherComplaint = sub.otherComplaint || '';
        rawHistoryOfIllness = sub.historyOfIllness || '';
      }

      let assessmentText = '';
      let icd10Code = '';
      let icd10Description = '';
      let rawSelectedDiagnoses: string[] = [];
      if (typeof note.assessment === 'string') {
        assessmentText = note.assessment;
      } else if (note.assessment && typeof note.assessment === 'object') {
        const ass = note.assessment as any;
        assessmentText = ass.diagnosis || '';
        icd10Code = ass.icd10Code || '';
        icd10Description = ass.icd10Description || '';
        rawSelectedDiagnoses = ass.selectedDiagnoses || [];
      }

      let planText = '';
      let rawLabExams = {};
      let rawOtherExamVal = '';
      let rawManagementChecked: string[] = [];
      let rawManagementOther = '';
      let rawManagementNotApplicable = false;
      if (typeof note.planManagement === 'string') {
        planText = note.planManagement;
      } else if (note.planManagement && typeof note.planManagement === 'object') {
        const plan = note.planManagement as any;
        planText = plan.plan || '';
        rawLabExams = plan.labExams || {};
        rawOtherExamVal = plan.otherExamVal || '';
        rawManagementChecked = plan.managementChecked || [];
        rawManagementOther = plan.managementOther || '';
        rawManagementNotApplicable = plan.managementNotApplicable || false;
      }

      return {
        id: note.id,
        memberId: note.memberId,
        memberPin: note.member.philhealthPin,
        memberName: `${note.member.firstName} ${note.member.lastName}`,
        visitDate: note.visitDate.toISOString(),
        subjective: subjectiveText,
        objective: note.objective,
        assessment: assessmentText,
        icd10Code,
        icd10Description,
        plan: planText,
        prescriptionIds: [],
        physicianName: note.physicianName,
        isYearEndCompliant: note.isYearEndCompliant,
        satisfactionScore: note.satisfactionScore || undefined,
        status: note.status,
        createdAt: note.visitDate.toISOString(),
        
        rawChiefComplaints,
        rawOtherComplaint,
        rawHistoryOfIllness,
        rawSelectedDiagnoses,
        rawLabExams,
        rawOtherExamVal,
        rawManagementChecked,
        rawManagementOther,
        rawManagementNotApplicable,
      };
    });

    return NextResponse.json({ soapNotes });
  } catch (error) {
    console.error('Fetch SOAP Notes Error:', error);
    return NextResponse.json({ error: 'Failed to fetch SOAP Notes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const soapData = await request.json();

    let memberId = soapData.memberId;
    if (!memberId && soapData.memberPin) {
      const member = await prisma.member.findUnique({
        where: { philhealthPin: soapData.memberPin },
      });
      if (member) {
        memberId = member.id;
      }
    }

    if (!memberId) {
      return NextResponse.json({ error: 'Member not found or memberId/memberPin missing' }, { status: 400 });
    }

    let soap;
    const existingSoap = soapData.id && !soapData.id.startsWith('soap-') ? await prisma.soapNote.findUnique({
      where: { id: soapData.id }
    }) : null;

    const dataObj = {
      memberId,
      physicianName: soapData.physicianName,
      subjective: {
        text: soapData.subjective,
        chiefComplaints: soapData.rawChiefComplaints || [],
        otherComplaint: soapData.rawOtherComplaint || '',
        historyOfIllness: soapData.rawHistoryOfIllness || '',
      },
      objective: soapData.objective,
      assessment: {
        diagnosis: soapData.assessment,
        icd10Code: soapData.icd10Code,
        icd10Description: soapData.icd10Description,
        selectedDiagnoses: soapData.rawSelectedDiagnoses || [],
      },
      planManagement: {
        plan: soapData.plan,
        labExams: soapData.rawLabExams || {},
        otherExamVal: soapData.rawOtherExamVal || '',
        managementChecked: soapData.rawManagementChecked || [],
        managementOther: soapData.rawManagementOther || '',
        managementNotApplicable: soapData.rawManagementNotApplicable || false,
      },
      isYearEndCompliant: soapData.isYearEndCompliant ?? false,
      satisfactionScore: soapData.satisfactionScore,
      status: soapData.status || 'Finalized',
      visitDate: soapData.visitDate ? new Date(soapData.visitDate) : undefined,
    };

    if (existingSoap) {
      soap = await prisma.soapNote.update({
        where: { id: soapData.id },
        data: dataObj,
      });
    } else {
      soap = await prisma.soapNote.create({
        data: dataObj,
      });
    }

    return NextResponse.json({ success: true, soap });
  } catch (error) {
    console.error('SOAP Note Error:', error);
    return NextResponse.json({ error: 'Failed to create/update SOAP Note' }, { status: 500 });
  }
}
