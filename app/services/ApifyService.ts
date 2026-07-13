import { ApifyClient } from 'apify-client';

export class ApifyService {
  private client: ApifyClient;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Apify API Token is missing. Please add it in Settings.');
    }
    this.client = new ApifyClient({ token: apiKey });
  }

  /**
   * Starts the LinkedIn Post Search actor
   */
  async startLinkedInScraper(searchQuery: string, maxPosts: number, webhookUrl: string) {
    return await this.client.actor('harvestapi/linkedin-post-search').start(
      {
        searchQueries: [searchQuery],
        maxPosts: maxPosts || 20,
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
  }

  /**
   * Fetches the dataset items from a completed Apify run
   */
  async getDatasetItems(runId: string) {
    return await this.client.run(runId).dataset().listItems();
  }
}
