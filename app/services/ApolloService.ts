export class ApolloService {
  private apiKey: string;
  private baseUrl = 'https://api.apollo.io/api/v1';

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("Apollo API key is required");
    }
    this.apiKey = apiKey;
  }

  /**
   * Enrich a lead using Apollo's people/match endpoint
   */
  async enrichLead(linkedinUrl: string, name?: string, webhookUrl?: string) {
    const payload: any = {
      linkedin_url: linkedinUrl,
      reveal_personal_emails: true,
      reveal_phone_number: !!webhookUrl,
    };

    if (webhookUrl) {
      payload.webhook_url = webhookUrl;
    }

    if (name) {
      // Very basic naive splitting if we only have a full name string
      const nameParts = name.trim().split(' ');
      if (nameParts.length > 1) {
        payload.first_name = nameParts[0];
        payload.last_name = nameParts.slice(1).join(' ');
      } else {
        payload.first_name = name;
      }
    }

    const response = await fetch(`${this.baseUrl}/people/match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': this.apiKey
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Apollo API Error Response:', text);
      throw new Error(`Apollo API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }

  /**
   * Enrich a lead specifically to find their phone number
   */
  async enrichLeadPhone(linkedinUrl: string, name?: string, webhookUrl?: string) {
    const payload: any = {
      linkedin_url: linkedinUrl,
      reveal_phone_number: true,
    };

    if (webhookUrl) {
      payload.webhook_url = webhookUrl;
    }

    if (name) {
      const nameParts = name.trim().split(' ');
      if (nameParts.length > 1) {
        payload.first_name = nameParts[0];
        payload.last_name = nameParts.slice(1).join(' ');
      } else {
        payload.first_name = name;
      }
    }

    const response = await fetch(`${this.baseUrl}/people/match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': this.apiKey
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Apollo API Error Response:', text);
      throw new Error(`Apollo API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }

  /**
   * Bulk enrich up to 10 leads at once
   */
  async bulkEnrichLeads(leads: Array<{ linkedinUrl: string, name?: string }>, webhookUrl?: string) {
    const details = leads.map(lead => {
      const person: any = { linkedin_url: lead.linkedinUrl };
      
      if (lead.name) {
        const nameParts = lead.name.trim().split(' ');
        if (nameParts.length > 1) {
          person.first_name = nameParts[0];
          person.last_name = nameParts.slice(1).join(' ');
        } else {
          person.first_name = lead.name;
        }
      }
      return person;
    });

    const payload: any = {
      details
    };

    if (webhookUrl) {
      payload.webhook_url = webhookUrl;
    }

    const response = await fetch(`${this.baseUrl}/people/bulk_match?reveal_personal_emails=true&reveal_phone_number=true`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': this.apiKey
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Apollo API Bulk Error Response:', text);
      throw new Error(`Apollo API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }
}

