import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/app/lib/db';
import Lead from '@/app/models/Lead';

function escapeCSV(val: any) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');

    await connectToDatabase();

    const query: any = { isQualified: true };
    if (jobId) {
      query.jobId = jobId;
    }

    const leads = await Lead.find(query).sort({ score: -1, createdAt: -1 }).lean();

    const headers = [
      'Profile URL',
      'Name',
      'Emails',
      'Phone Number',
      'AI Reasoning',
      'Outreach Hook',
      'Post Content',
      'Post URL'
    ];

    const rows = leads.map(lead => {
      const name = [lead.firstName, lead.lastName].filter(Boolean).join(' ') || 'Unknown';
      const emails = lead.personalEmails?.length ? lead.personalEmails.join(', ') : lead.firstPersonalEmail || 'Not Found';
      const phones = lead.phones?.length ? lead.phones.join(', ') : 'Not Found';

      return [
        lead.profileUrl || '',
        name,
        emails,
        phones,
        lead.aiReasoning || '',
        lead.outreachHook || '',
        lead.postContent || '',
        lead.postUrl || ''
      ];
    });

    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="qualified_leads${jobId ? `_${jobId}` : ''}.csv"`
      }
    });

  } catch (error) {
    console.error('Failed to export leads:', error);
    return NextResponse.json({ error: 'Failed to export leads' }, { status: 500 });
  }
}
