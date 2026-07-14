import { NextResponse } from 'next/server';
import { LeadService } from '@/app/services/LeadService';
import { PaginationSchema } from '@/app/lib/validations';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const paginationResult = PaginationSchema.safeParse({
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
    });

    if (!paginationResult.success) {
      return NextResponse.json({ error: 'Invalid pagination parameters' }, { status: 400 });
    }

    const { page, limit } = paginationResult.data;

    const data = await LeadService.getLeads(page, limit);
      
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
