import connectToDatabase from '@/app/lib/db';
import Lead from '@/app/models/Lead';

export class LeadService {
  /**
   * Fetches paginated qualified leads
   */
  static async getLeads(page: number = 1, limit: number = 20) {
    await connectToDatabase();
    
    const skip = (page - 1) * limit;
    
    // Only fetch qualified leads (score >= 7) for the main leads view
    const query = { isQualified: true };
    
    const leads = await Lead.find(query)
      .sort({ score: -1, createdAt: -1 }) // Sort by highest score first
      .skip(skip)
      .limit(limit)
      .lean();
      
    const totalLeads = await Lead.countDocuments(query);
    const totalPages = Math.ceil(totalLeads / limit);

    return { leads, pagination: { page, limit, totalLeads, totalPages } };
  }

  /**
   * Fetches un-evaluated leads for a specific job
   */
  static async getUnevaluatedLeads(jobId: string) {
    await connectToDatabase();
    return await Lead.find({ jobId, isQualified: false, score: { $exists: false } }).lean();
  }

  /**
   * Fetches details of a single lead
   */
  static async getLeadDetails(leadId: string) {
    await connectToDatabase();
    const lead = await Lead.findById(leadId).populate('jobId', 'searchQuery profileUrl status').lean();
    
    if (!lead) {
      throw new Error('Lead not found');
    }

    return lead;
  }

  /**
   * Updates a lead
   */
  static async updateLead(leadId: string, updates: any) {
    await connectToDatabase();
    return await Lead.findByIdAndUpdate(leadId, updates, { new: true });
  }

  /**
   * Deletes a single lead
   */
  static async deleteLead(leadId: string) {
    await connectToDatabase();
    const lead = await Lead.findByIdAndDelete(leadId);
    
    if (!lead) {
      throw new Error('Lead not found');
    }

    return { success: true, deletedLeadId: leadId };
  }

  /**
   * Transforms and saves raw Apify dataset items as Leads
   */
  static async saveScrapedLeads(jobId: string, items: any[], searchQuery: string) {
    await connectToDatabase();
    
    const leadsToInsert = items.map((item: any) => {
      const postText = item.content || item.text || item.postContent || '';
      
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

      return {
        jobId,
        searchQuery,
        profileUrl,
        postContent: `Author: ${authorName} (${authorInfo})\n\n${postText}`,
        postUrl,
        postedAt: postedAtStr,
        engagementStats: {
          likes: likesCount,
          comments: commentsCount,
          shares: sharesCount,
        },
        isQualified: false, // Default to false until AI evaluates
      };
    }).filter((l: any) => l.postContent.trim() !== `Author:  ()\n\n`);

    if (leadsToInsert.length > 0) {
      try {
        await Lead.insertMany(leadsToInsert, { ordered: false });
      } catch (e: any) {
        // Ignore duplicate key errors
        if (e.code !== 11000) {
          console.error("Error inserting leads:", e);
        }
      }
    }
    
    return leadsToInsert.length;
  }
}
