import { NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';
import connectToDatabase from '@/app/lib/db';
import Job from '@/app/models/Job';

export async function GET() {
  try {
    await connectToDatabase();
    const jobs = await Job.find().sort({ createdAt: -1 }).limit(5).lean();
    
    // Fetch lead stats for each job
    const jobsWithStats = await Promise.all(
      jobs.map(async (job) => {
        // We import Lead dynamically or we can just require it
        const Lead = require('@/app/models/Lead').default;
        const totalLeads = await Lead.countDocuments({ jobId: job._id });
        const qualifiedLeads = await Lead.countDocuments({ jobId: job._id, isQualified: true });
        const evaluatedLeads = await Lead.countDocuments({ jobId: job._id, score: { $exists: true } });
        
        return {
          ...job,
          stats: { totalLeads, qualifiedLeads, evaluatedLeads },
        };
      })
    );
    
    return NextResponse.json({ jobs: jobsWithStats });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { searchQuery, maxPosts = 20 } = await req.json();

    if (!searchQuery) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    await connectToDatabase();

    const User = require('@/app/models/User').default;
    const adminUser = await User.findOne();
    const apifyToken = adminUser?.apifyApiKey || process.env.APIFY_API_TOKEN;

    if (!apifyToken) {
      return NextResponse.json({ error: 'Apify API Token is not configured. Please add it in Settings.' }, { status: 400 });
    }

    const apifyClient = new ApifyClient({ token: apifyToken });

    // 1. Create a Job in MongoDB
    const job = await Job.create({
      searchQuery,
      status: 'SCRAPING',
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://sacrifice-palm-compost.ngrok-free.dev');
    const webhookUrl = `${baseUrl}/api/webhooks/apify?jobId=${job._id}`;

    // 2. Start Apify Actor (harvestapi/linkedin-post-search)
    const run = await apifyClient.actor('harvestapi/linkedin-post-search').start(
      {
        searchQueries: [searchQuery],
        maxPosts: parseInt(maxPosts, 10) || 20,
        deepScrape: false,
        profileScraperMode: 'short',
        startPage: 1,
        reactionsProfileScraperMode: 'short',
        commentsProfileScraperMode: 'short',
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
