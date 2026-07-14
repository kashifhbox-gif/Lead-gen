import { z } from 'zod';

export const CampaignCreateSchema = z.object({
  searchQuery: z.string().min(1, 'Search query is required'),
  maxPosts: z.number().int().min(1).max(100).optional().default(20),
  postedLimit: z.string().optional(),
  postedLimitDate: z.string().optional(),
  sortBy: z.string().optional(),
  profileScraperMode: z.enum(['short', 'main']).optional(),
});

export const SettingsUpdateSchema = z.object({
  apifyApiKey: z.string().optional(),
  geminiApiKey: z.string().optional(),
  geminiModel: z.string().optional(),
  aiPrompt: z.string().min(10, 'Prompt must be at least 10 characters').optional(),
});

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});
