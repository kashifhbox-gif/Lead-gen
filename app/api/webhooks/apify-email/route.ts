import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/lib/db';
import { SettingsService } from '@/app/services/SettingsService';
import Lead from '@/app/models/Lead';
import { ApifyService } from '@/app/services/ApifyService';
import Job from '@/app/models/Job';

export async function POST(request: Request) {
  let jobId: string | null = null;
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    jobId = searchParams.get('jobId');

    const eventType = body.eventType;
    if (eventType !== 'ACTOR.RUN.SUCCEEDED') {
      return NextResponse.json({ message: 'Ignored non-success event' });
    }

    await connectToDatabase();

    const adminConfig = await SettingsService.getAdminConfig();
    const apifyToken = adminConfig?.apifyApiKey || process.env.APIFY_API_TOKEN;

    if (!apifyToken) {
      console.error('Apify API key missing');
      return NextResponse.json({ error: 'Settings not configured' }, { status: 500 });
    }

    const apifyService = new ApifyService(apifyToken);
    const datasetResponse = await apifyService.getDatasetItems(body.resource.id);
    const datasetItems = datasetResponse.items;

    // Update leads
    for (const item of datasetItems) {
      const it = item as any;
      if (it.linkedin_url) {
        const updateData: any = {};
        if (it.first_name) updateData.firstName = it.first_name;
        if (it.last_name) updateData.lastName = it.last_name;
        if (it.first_personal_email) updateData.firstPersonalEmail = it.first_personal_email;
        if (Array.isArray(it.personal_emails) && it.personal_emails.length > 0) updateData.personalEmails = it.personal_emails;

        // Handle possible trailing slashes in the URL
        let cleanUrl = it.linkedin_url.replace(/\/$/, '');
        // Escape special regex characters
        cleanUrl = cleanUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        await Lead.updateMany(
          { 
            jobId: jobId, 
            profileUrl: { $regex: new RegExp(`^${cleanUrl}/?$`, 'i') } 
          },
          { $set: updateData }
        );
      }
    }

    if (jobId) {
      await Job.findByIdAndUpdate(jobId, { emailEnrichmentStatus: 'COMPLETED' });
    }

    return NextResponse.json({ message: 'Email enrichment completed successfully' });

  } catch (error: any) {
    console.error('Apify Email Webhook Error:', error);
    if (jobId) {
      await connectToDatabase();
      await Job.findByIdAndUpdate(jobId, { emailEnrichmentStatus: 'FAILED' });
    }
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
