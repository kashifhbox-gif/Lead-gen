import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/lib/db';
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
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Prevent duplicate enrichment jobs
    if (
      job.emailEnrichmentStatus === 'PENDING' ||
      job.emailEnrichmentStatus === 'RUNNING'
    ) {
      return NextResponse.json(
        {
          message: 'Lead enrichment is already in progress.'
        },
        { status: 409 }
      );
    }

    // Mark as pending before dispatching the event
    job.emailEnrichmentStatus = 'PENDING';
    await job.save();

    // Trigger the same Inngest workflow
    // used by automatic enrichment
    await inngest.send({
      name: 'app/enrich.leads',
      data: {
        jobId: job._id.toString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Lead enrichment started in the background.',
    });

  } catch (error: any) {
    console.error('Email Enrichment Error:', error);

    return NextResponse.json(
      {
        error: error.message
      },
      {
        status: 500
      }
    );
  }
}