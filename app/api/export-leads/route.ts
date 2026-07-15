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
      'First Name',
      'Last Name',
      'Emails',
      'AI Score',
      'AI Reasoning',
      'Outreach Hook',
      'Post Content',
      'Post URL',
      'Likes',
      'Comments',
      'Created At'
    ];

    const rows = leads.map(lead => [
      lead.profileUrl || '',
      lead.firstName || '',
      lead.lastName || '',
      lead.personalEmails?.join(', ') || lead.firstPersonalEmail || '',
      lead.score || '',
      lead.aiReasoning || '',
      lead.outreachHook || '',
      lead.postContent || '',
      lead.postUrl || '',
      lead.engagementStats?.likes || 0,
      lead.engagementStats?.comments || 0,
      new Date(lead.createdAt).toISOString()
    ]);

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
