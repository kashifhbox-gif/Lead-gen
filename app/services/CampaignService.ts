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
   * Fetches a single campaign by ID along with its associated leads
   */
  static async getCampaignDetails(jobId: string) {
    await connectToDatabase();
    const job = await Job.findById(jobId).lean();
    
    if (!job) {
      throw new Error('Campaign not found');
    }

    const leads = await Lead.find({ jobId }).sort({ score: -1, createdAt: -1 }).lean();
    
    const stats = {
      totalLeads: leads.length,
      qualifiedLeads: leads.filter(l => l.isQualified).length,
      evaluatedLeads: leads.filter(l => l.score !== undefined).length,
    };

    return { job, leads, stats };
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
    return await Job.findByIdAndUpdate(jobId, updates, { new: true });
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
