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

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;
    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
    }

    const payload = await req.json();
    
    // We expect { firstName, lastName, firstPersonalEmail, phone }
    const updates: any = {};
    if (payload.firstName !== undefined) updates.firstName = payload.firstName;
    if (payload.lastName !== undefined) updates.lastName = payload.lastName;
    if (payload.firstPersonalEmail !== undefined) {
      updates.firstPersonalEmail = payload.firstPersonalEmail;
      if (payload.firstPersonalEmail) {
        updates.allEmails = [payload.firstPersonalEmail]; // keep it simple
      }
    }
    
    if (payload.phone !== undefined) {
      if (payload.phone) {
        updates.phones = [payload.phone];
      } else {
        updates.phones = [];
      }
    }

    const updatedLead = await LeadService.updateLead(leadId, updates);

    return NextResponse.json({ message: 'Lead updated successfully', lead: updatedLead });
  } catch (error: any) {
    console.error('Error updating lead:', error);
    if (error.message === 'Lead not found') {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
