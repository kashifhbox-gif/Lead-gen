import { NextResponse } from 'next/server';
import { inngest } from '@/app/lib/inngest';
import Job from '@/app/models/Job';
import connectToDatabase from '@/app/lib/db';

export async function GET() {
  await connectToDatabase();
  await inngest.send({
    name: 'app/evaluate.leads',
    data: {
      jobId: '6a56779a426fb5653a0aa312',
    },
  });
  
  return NextResponse.json({ triggered: true });
}
