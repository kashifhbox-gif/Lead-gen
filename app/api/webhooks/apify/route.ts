import { NextResponse } from 'next/server';
import { SettingsService } from '@/app/services/SettingsService';
import { ApifyService } from '@/app/services/ApifyService';
import { CampaignService } from '@/app/services/CampaignService';
import { LeadService } from '@/app/services/LeadService';
import { inngest } from '@/app/lib/inngest';

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
    }

    const payload = await req.json();
    const runId = payload.eventData.actorRunId;

    // Fetch the campaign details to ensure it exists
    const { job } = await CampaignService.getCampaignDetails(jobId);

    // Fetch Admin settings for Apify Token
    const adminConfig = await SettingsService.getAdminConfig();
    const apifyToken = adminConfig?.apifyApiKey || process.env.APIFY_API_TOKEN;

    if (!apifyToken) {
      throw new Error('Apify API Token is not configured');
    }

    const apifyService = new ApifyService(apifyToken);

    // Fetch the results from Apify's dataset
    const dataset = await apifyService.getDatasetItems(runId);
    const items = dataset.items;

    // Create a Lead record for each post scraped
    await LeadService.saveScrapedLeads(jobId, items, job.searchQuery);

    await CampaignService.updateCampaign(jobId, { status: 'SCRAPED' });

    // Trigger Inngest to evaluate these leads asynchronously
    await inngest.send({
      name: 'app/evaluate.leads',
      data: {
        jobId: jobId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Apify Webhook Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
