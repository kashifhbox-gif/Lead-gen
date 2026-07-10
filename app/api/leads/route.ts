import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/lib/db';
import Lead from '@/app/models/Lead';

export async function GET() {
  try {
    await connectToDatabase();
    
    // Fetch only qualified leads, sorted by score and date
    const leads = await Lead.find({ isQualified: true })
      .populate('jobId', 'profileUrl')
      .sort({ score: -1, createdAt: -1 })
      .limit(50);
      
    return NextResponse.json({ leads });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
