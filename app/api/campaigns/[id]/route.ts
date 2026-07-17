import { NextResponse } from 'next/server';
import { CampaignService } from '@/app/services/CampaignService';
import { PaginationSchema } from '@/app/lib/validations';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const paginationResult = PaginationSchema.safeParse({
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
    });

    if (!paginationResult.success) {
      return NextResponse.json({ error: 'Invalid pagination parameters' }, { status: 400 });
    }

    const { page, limit } = paginationResult.data;
    const filter = searchParams.get('filter') || 'ALL';
    const searchQuery = searchParams.get('searchQuery') || '';

    const data = await CampaignService.getCampaignDetails(jobId, page, limit, filter, searchQuery);
    
    return NextResponse.json(data);
  } catch (error: any) {
    if (error.message === 'Campaign not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
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
