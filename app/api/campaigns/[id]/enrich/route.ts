import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/lib/db';
import Lead from '@/app/models/Lead';
import Job from '@/app/models/Job';
import { inngest } from '@/app/lib/inngest';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id: jobId } = await params;

    const job = await Job.findById(jobId);
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Find qualified leads that don't already have emails
    const leads = await Lead.find({ 
      jobId, 
      isQualified: true,
      profileUrl: { $exists: true, $ne: null },
      firstPersonalEmail: { $exists: false }
    });

    if (leads.length === 0) {
      return NextResponse.json({ message: 'No qualified leads without emails found.' }, { status: 400 });
    }

    // Dispatch the Inngest background job to process these with Apollo
    await inngest.send({
      name: 'app/enrich.leads',
      data: {
        jobId: job._id.toString()
      }
    });

    job.emailEnrichmentStatus = 'PENDING';
    await job.save();

    return NextResponse.json({ message: `Started email enrichment for ${leads.length} leads in the background via Apollo.` });

  } catch (error: any) {
    console.error('Email Enrichment Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
