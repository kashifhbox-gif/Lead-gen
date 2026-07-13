import { NextResponse } from 'next/server';
import { CampaignService } from '@/app/services/CampaignService';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    const data = await CampaignService.getCampaignDetails(jobId);
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching job details:', error);
    if (error.message === 'Campaign not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
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

    await CampaignService.deleteCampaign(jobId);

    return NextResponse.json({ message: 'Campaign and associated leads deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting campaign:', error);
    if (error.message === 'Campaign not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
