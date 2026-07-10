import { NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';
import connectToDatabase from '@/app/lib/db';
import Job from '@/app/models/Job';

const apifyClient = new ApifyClient({
  token: process.env.APIFY_API_TOKEN,
});

export async function GET() {
  try {
    await connectToDatabase();
    const jobs = await Job.find().sort({ createdAt: -1 }).limit(20);
    return NextResponse.json({ jobs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { profileUrl } = await req.json();

    if (!profileUrl) {
      return NextResponse.json({ error: 'Profile URL is required' }, { status: 400 });
    }

    await connectToDatabase();

    // 1. Create a Job in MongoDB
    const job = await Job.create({
      profileUrl,
      status: 'SCRAPING',
    });

    const host = req.headers.get('host');
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
    const webhookUrl = `${baseUrl}/api/webhooks/apify?jobId=${job._id}`;

    // 2. Start Apify Actor (harvestapi/linkedin-profile-posts)
    const run = await apifyClient.actor('harvestapi/linkedin-profile-posts').start(
      {
        profileUrls: [profileUrl],
        maxPosts: 15, // Configurable
      },
      {
        webhooks: [
          {
            eventTypes: ['ACTOR.RUN.SUCCEEDED'],
            requestUrl: webhookUrl,
          },
        ],
      }
    );

    // 3. Update Job with Run ID
    job.apifyRunId = run.id;
    await job.save();

    return NextResponse.json({ success: true, jobId: job._id });
  } catch (error: any) {
    console.error('Job creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
