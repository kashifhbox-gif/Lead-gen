import { NextResponse } from 'next/server';
import { LeadService } from '@/app/services/LeadService';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;
    
    // For GET, you might need population, but LeadService currently returns a raw lead.
    // If you need populated data in the UI, we should update the LeadService to populate it,
    // but for now, we'll fetch the base lead details.
    const lead = await LeadService.getLeadDetails(leadId);
      
    return NextResponse.json({ lead });
  } catch (error: any) {
    if (error.message === 'Lead not found') {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }
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

    await LeadService.deleteLead(leadId);

    return NextResponse.json({ message: 'Lead deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting lead:', error);
    if (error.message === 'Lead not found') {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
