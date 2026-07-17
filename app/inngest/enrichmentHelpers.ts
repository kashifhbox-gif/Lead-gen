import { LeadService } from "@/app/services/LeadService";
import { ApolloService } from "@/app/services/ApolloService";

export async function processEnrichmentChunk(
  chunk: any[],
  apolloService: ApolloService,
  logger: any
): Promise<string[]> {
  try {
    logger.info({ chunkLength: chunk.length }, "Preparing payload for Apollo API");

    const bulkPayload = chunk.map((lead: any) => {
      let name = lead.firstName && lead.lastName ? `${lead.firstName} ${lead.lastName}` : undefined;
      if (!name && lead.postContent) {
        const authorMatch = lead.postContent.match(/Author:\s*([^(\n]+)/i);
        if (authorMatch && authorMatch[1]) {
          name = authorMatch[1].trim();
        }
      }
      return {
        linkedinUrl: lead.profileUrl,
        name,
        _id: lead._id
      };
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const leadIdsStr = chunk.map((l: any) => l._id.toString()).join(',');
    const webhookUrl = `${baseUrl}/api/webhooks/apollo?leadIds=${leadIdsStr}`;
    
    logger.info({ webhookUrl }, "Calling apolloService.bulkEnrichLeads");
    const apolloData = await apolloService.bulkEnrichLeads(bulkPayload, webhookUrl);
    
    const needsTimeout: string[] = [];
    
    const matches = apolloData?.matches || apolloData?.contacts || apolloData?.people || [];
    logger.info({ matchCount: matches.length }, "Received match data from Apollo");

    let successfulMatches = 0;

    for (const person of matches) {
      const matchedLead = chunk.find((l: any) => l.profileUrl === person.linkedin_url);
      if (matchedLead) {
        const emails = [];
        if (person.email) emails.push(person.email);
        if (person.personal_emails && person.personal_emails.length > 0) {
          emails.push(...person.personal_emails);
        }

        const phoneNumbers = person.phone_numbers ? person.phone_numbers.map((p: any) => p.sanitized_number) : [];

        await LeadService.updateLead(matchedLead._id, {
          firstPersonalEmail: emails[0] || matchedLead.firstPersonalEmail,
          allEmails: Array.from(new Set([...(matchedLead.allEmails || []), ...emails])),
          firstName: person.first_name || matchedLead.firstName,
          lastName: person.last_name || matchedLead.lastName,
          phones: Array.from(new Set([...(matchedLead.phones || []), ...phoneNumbers])),
          apolloEnrichmentAttempted: true,
          apolloPhoneEnrichmentRequested: phoneNumbers.length === 0
        });

        successfulMatches++;
        if (phoneNumbers.length === 0) {
          needsTimeout.push(matchedLead._id.toString());
        }
      }
    }

    logger.info({ successfulMatches }, "Updated database for successful immediate matches");

    // Keep spinners active for leads that didn't match immediately, as Apollo will fetch them async
    let asyncMatches = 0;
    for (const lead of chunk) {
      const foundInMatches = matches.find((p: any) => p.linkedin_url === lead.profileUrl);
      if (!foundInMatches) {
        await LeadService.updateLead(lead._id, {
          apolloEnrichmentAttempted: true,
          apolloPhoneEnrichmentRequested: true,
          apolloEmailEnrichmentRequested: true
        });
        needsTimeout.push(lead._id.toString());
        asyncMatches++;
      }
    }
    
    if (asyncMatches > 0) {
      logger.info({ asyncMatches }, "Marked remaining leads for async processing");
    }

    return needsTimeout;
  } catch (error: any) {
    logger.error({ err: error.message }, "Failed to bulk enrich chunk");
    return [];
  }
}
