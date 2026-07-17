import connectToDatabase from '@/app/lib/db';
import User from '@/app/models/User';

export class SettingsService {
  /**
   * Fetch a specific user's settings by email
   */
  static async getSettings(email: string) {
    await connectToDatabase();
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  /**
   * Fetch the global admin config (used by background jobs)
   */
  static async getAdminConfig() {
    await connectToDatabase();
    return await User.findOne();
  }

  /**
   * Update settings for a user
   */
  static async updateSettings(email: string, updates: any) {
    await connectToDatabase();
    
    const updateData: any = {};
    if (updates.aiPrompt !== undefined) updateData.aiPrompt = updates.aiPrompt;
    if (updates.apifyApiKey !== undefined) updateData.apifyApiKey = updates.apifyApiKey;
    if (updates.geminiApiKey !== undefined) updateData.geminiApiKey = updates.geminiApiKey;
    if (updates.geminiModel !== undefined) updateData.geminiModel = updates.geminiModel;
    if (updates.apolloApiKey !== undefined) updateData.apolloApiKey = updates.apolloApiKey;

    const user = await User.findOneAndUpdate(
      { email },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
}
