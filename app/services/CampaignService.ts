import connectToDatabase from '@/app/lib/db';
import Job from '@/app/models/Job';
import Lead from '@/app/models/Lead';

export class CampaignService {
  /**
   * Fetches recent campaigns with their lead statistics
   */
  static async getRecentCampaigns(limit: number = 5) {
    await connectToDatabase();
    const jobs = await Job.find().sort({ createdAt: -1 }).limit(limit).lean();
    
    return await Promise.all(
      jobs.map(async (job) => {
        const totalLeads = await Lead.countDocuments({ jobId: job._id });
        const qualifiedLeads = await Lead.countDocuments({ jobId: job._id, isQualified: true });
        const evaluatedLeads = await Lead.countDocuments({ jobId: job._id, score: { $exists: true } });
        
        return {
          ...job,
          stats: { totalLeads, qualifiedLeads, evaluatedLeads },
        };
      })
    );
  }

  /**
   * Fetches paginated campaigns with their lead statistics
   */
  static async getCampaignsPaginated(page: number = 1, limit: number = 20, tab: string = 'active') {
    await connectToDatabase();
    const skip = (page - 1) * limit;

    const query: any = {};
    if (tab === 'completed') {
      query.$and = [
        { status: { $in: ['COMPLETED', 'FAILED'] } },
        { emailEnrichmentStatus: { $nin: ['RUNNING'] } }
      ];
    } else {
      query.$or = [
        { status: { $nin: ['COMPLETED', 'FAILED'] } },
        { emailEnrichmentStatus: 'RUNNING' }
      ];
    }

    const [jobs, totalCount] = await Promise.all([
      Job.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Job.countDocuments(query)
    ]);
    
    const jobsWithStats = await Promise.all(
      jobs.map(async (job) => {
        const totalLeads = await Lead.countDocuments({ jobId: job._id });
        const qualifiedLeads = await Lead.countDocuments({ jobId: job._id, isQualified: true });
        const evaluatedLeads = await Lead.countDocuments({ jobId: job._id, score: { $exists: true } });
        
        return {
          ...job,
          stats: { totalLeads, qualifiedLeads, evaluatedLeads },
        };
      })
    );

    return {
      jobs: jobsWithStats,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  }

  /**
   * Fetches a single campaign by ID along with its associated leads (paginated)
   */
  static async getCampaignDetails(jobId: string, page: number = 1, limit: number = 50, filter: string = 'ALL', searchQuery: string = '') {
    await connectToDatabase();
    const job = await Job.findById(jobId).lean();
    
    if (!job) {
      throw new Error('Campaign not found');
    }

    const skip = (page - 1) * limit;

    // Build the query object
    const query: any = { jobId };
    
    if (filter === 'QUALIFIED') query.isQualified = true;
    if (filter === 'REJECTED') query.isQualified = false;
    if (filter === 'PENDING') query.isQualified = { $exists: false };

    if (searchQuery) {
      const q = new RegExp(searchQuery, 'i');
      query.$or = [
        { postContent: q },
        { aiReasoning: q }
      ];
    }

    const [leads, totalLeadsCount] = await Promise.all([
      Lead.find(query)
        .sort({ score: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Lead.countDocuments(query),
    ]);
    
    const stats = {
      totalLeads: totalLeadsCount,
      globalTotalLeads: await Lead.countDocuments({ jobId }),
      qualifiedLeads: await Lead.countDocuments({ jobId, isQualified: true }),
      evaluatedLeads: await Lead.countDocuments({ jobId, score: { $exists: true } }),
      completedEnrichment: await Lead.countDocuments({ 
        jobId, 
        apolloEnrichmentAttempted: true, 
        apolloEmailEnrichmentRequested: false, 
        apolloPhoneEnrichmentRequested: false,
        $or: [
          { firstPersonalEmail: { $exists: true } },
          { phones: { $not: { $size: 0 } } }
        ]
      }),
      failedEnrichment: await Lead.countDocuments({ 
        jobId, 
        apolloEnrichmentAttempted: true, 
        apolloEmailEnrichmentRequested: false, 
        apolloPhoneEnrichmentRequested: false,
        firstPersonalEmail: { $exists: false },
        phones: { $size: 0 }
      }),
      pendingEnrichment: await Lead.countDocuments({
        jobId,
        $or: [
          { apolloEmailEnrichmentRequested: true },
          { apolloPhoneEnrichmentRequested: true }
        ],
        apolloEnrichmentRequestedAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) }
      }),
      timedOutEnrichment: await Lead.countDocuments({
        jobId,
        $or: [
          { apolloEmailEnrichmentRequested: true },
          { apolloPhoneEnrichmentRequested: true }
        ],
        apolloEnrichmentRequestedAt: { $lt: new Date(Date.now() - 15 * 60 * 1000) }
      }),
    };

    return { 
      job, 
      leads, 
      stats,
      pagination: {
        total: totalLeadsCount,
        page,
        limit,
        totalPages: Math.ceil(totalLeadsCount / limit)
      }
    };
  }

  /**
   * Creates a new campaign/job in the database
   */
  static async createCampaign(searchQuery: string, filters?: any) {
    await connectToDatabase();
    return await Job.create({
      searchQuery,
      status: 'SCRAPING',
      filters,
    });
  }

  /**
   * Updates an existing campaign
   */
  static async updateCampaign(jobId: string, updates: any) {
    await connectToDatabase();
    return await Job.findByIdAndUpdate(jobId, updates, { returnDocument: 'after' });
  }

  /**
   * Deletes a campaign and all of its associated leads
   */
  static async deleteCampaign(jobId: string) {
    await connectToDatabase();
    const job = await Job.findByIdAndDelete(jobId);
    
    if (!job) {
      throw new Error('Campaign not found');
    }

    // Delete all associated leads
    await Lead.deleteMany({ jobId });

    return { success: true, deletedJobId: jobId };
  }
}
