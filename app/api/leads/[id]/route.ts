import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/lib/db';
import Lead from '@/app/models/Lead';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    
    const { id: leadId } = await params;
    const lead = await Lead.findById(leadId).populate('jobId', 'searchQuery profileUrl status');
    
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }
      
    return NextResponse.json({ lead });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;
    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
    }

    await connectToDatabase();

    const lead = await Lead.findByIdAndDelete(leadId);
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Lead deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting lead:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
