import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/lib/db';
import Job from '@/app/models/Job';
import Lead from '@/app/models/Lead';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    await connectToDatabase();

    const job = await Job.findById(jobId);
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const leads = await Lead.find({ jobId }).sort({ createdAt: -1 });

    return NextResponse.json({ job, leads });
  } catch (error: any) {
    console.error('Error fetching job details:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    await connectToDatabase();

    const job = await Job.findByIdAndDelete(jobId);
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Delete all leads associated with this campaign
    await Lead.deleteMany({ jobId });

    return NextResponse.json({ message: 'Campaign and associated leads deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
