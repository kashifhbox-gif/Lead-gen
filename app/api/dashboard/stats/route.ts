import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/lib/db';
import Job from '@/app/models/Job';
import Lead from '@/app/models/Lead';
import { CampaignService } from '@/app/services/CampaignService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDatabase();

    const [totalCampaigns, totalLeads, qualifiedLeads, recentCampaigns] = await Promise.all([
      Job.countDocuments(),
      Lead.countDocuments(),
      Lead.countDocuments({ isQualified: true }),
      CampaignService.getRecentCampaigns(5),
    ]);

    const qualificationRate = totalLeads > 0 ? ((qualifiedLeads / totalLeads) * 100).toFixed(1) : "0.0";

    // Time Series Data (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const timeSeriesData = await Lead.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
             dateString: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
             displayDate: { $dateToString: { format: "%b %d", date: "$createdAt" } }
          },
          totalLeads: { $sum: 1 },
          qualifiedLeads: {
            $sum: { $cond: [{ $eq: ["$isQualified", true] }, 1, 0] }
          }
        }
      },
      {
        $sort: { "_id.dateString": 1 }
      },
      {
        $project: {
          _id: 0,
          date: "$_id.displayDate",
          totalLeads: 1,
          qualifiedLeads: 1
        }
      }
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalCampaigns,
        totalLeads,
        qualifiedLeads,
        qualificationRate: parseFloat(qualificationRate as string),
        timeSeriesData,
        recentCampaigns
      }
    });

  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
