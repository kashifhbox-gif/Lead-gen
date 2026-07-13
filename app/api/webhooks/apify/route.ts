import { NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';
import connectToDatabase from '@/app/lib/db';
import Job from '@/app/models/Job';
import Lead from '@/app/models/Lead';
import { inngest } from '@/app/lib/inngest';

const apifyClient = new ApifyClient({
  token: process.env.APIFY_API_TOKEN,
});

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
    }

    const payload = await req.json();
    
    // Apify payload contains the run details
    const runId = payload.eventData.actorRunId;

    await connectToDatabase();
    
    const job = await Job.findById(jobId);
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Fetch the results from Apify's dataset
    const dataset = await apifyClient.run(runId).dataset().listItems();
    const items = dataset.items;

    // Create a Lead record for each post scraped
    for (const item of items as any[]) {
      const postText = item.content || item.text || item.postContent;
      if (!postText) continue;

      let postedAtStr = '';
      if (item.postedAt && item.postedAt.date) {
        postedAtStr = item.postedAt.date;
      } else if (item.postedAt && typeof item.postedAt === 'string') {
        postedAtStr = item.postedAt;
      }

      let commentsCount = item.engagement?.comments || 0;
      let likesCount = item.engagement?.likes || 0;
      let sharesCount = item.engagement?.shares || 0;
      
      const authorName = item.author?.name || '';
      const authorInfo = item.author?.info || '';
      const profileUrl = item.author?.linkedinUrl || item.authorProfileUrl || item.authorUrl || '';
      const postUrl = item.linkedinUrl || item.url || item.postUrl || '';

      await Lead.create({
        jobId: job._id,
        searchQuery: job.searchQuery,
        profileUrl,
        postContent: `Author: ${authorName} (${authorInfo})\n\n${postText}`,
        postUrl,
        postedAt: postedAtStr,
        engagementStats: {
          likes: likesCount,
          comments: commentsCount,
          shares: sharesCount,
        }
      });
    }

    job.status = 'SCRAPED';
    await job.save();

    // Trigger Inngest to evaluate these leads asynchronously
    await inngest.send({
      name: 'app/evaluate.leads',
      data: {
        jobId: job._id.toString(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Apify Webhook Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
