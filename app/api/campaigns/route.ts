import { NextResponse } from 'next/server';
import { SettingsService } from '@/app/services/SettingsService';
import { ApifyService } from '@/app/services/ApifyService';
import { CampaignService } from '@/app/services/CampaignService';
import { CampaignCreateSchema } from '@/app/lib/validations';

export async function GET() {
  try {
    const jobsWithStats = await CampaignService.getRecentCampaigns(5);
    return NextResponse.json({ jobs: jobsWithStats });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = CampaignCreateSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { searchQuery, maxPosts, postedLimit, postedLimitDate, sortBy, profileScraperMode } = result.data;

    // Get the global API key config
    const adminConfig = await SettingsService.getAdminConfig();
    const apifyToken = adminConfig?.apifyApiKey || process.env.APIFY_API_TOKEN;

    if (!apifyToken) {
      return NextResponse.json({ error: 'Apify API Token is not configured. Please add it in Settings.' }, { status: 400 });
    }

    const apifyService = new ApifyService(apifyToken);

    const filters = { postedLimit, postedLimitDate, sortBy, profileScraperMode };

    // 1. Create a Job in MongoDB
    const job = await CampaignService.createCampaign(searchQuery, filters);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://sacrifice-palm-compost.ngrok-free.dev');
    const webhookUrl = `${baseUrl}/api/webhooks/apify?jobId=${job._id}`;

    // 2. Start Apify Actor
    const run = await apifyService.startLinkedInScraper(searchQuery, maxPosts, webhookUrl, filters);

    // 3. Update Job with Run ID
    await CampaignService.updateCampaign(job._id as string, { apifyRunId: run.id });

    return NextResponse.json({ success: true, jobId: job._id });
  } catch (error: any) {
    console.error('Job creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
