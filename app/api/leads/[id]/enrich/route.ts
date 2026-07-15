import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/lib/db';
import Lead from '@/app/models/Lead';
import { SettingsService } from '@/app/services/SettingsService';
import { ApolloService } from '@/app/services/ApolloService';
import fs from 'fs';
import path from 'path';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id: leadId } = await params;

    const lead = await Lead.findById(leadId);
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    if (!lead.profileUrl) {
      return NextResponse.json({ error: 'Lead has no LinkedIn Profile URL to enrich.' }, { status: 400 });
    }

    // Fetch API key
    const adminConfig = await SettingsService.getAdminConfig();
    let apolloKey = adminConfig?.apolloApiKey || process.env.APOLLO_API_KEY;
    
    if (!apolloKey) {
      try {
        const envFile = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf-8');
        const match = envFile.match(/APOLLO_API_KEY=([^\n\r]+)/);
        if (match) apolloKey = match[1].trim().replace(/^"|"$/g, '');
      } catch (e) { }
    }

    if (!apolloKey) {
      return NextResponse.json({ error: 'Apollo API Key is not configured. Please add it in Settings.' }, { status: 400 });
    }

    const apolloService = new ApolloService(apolloKey);

    // Attempt to extract a name if none is explicitly provided, based on postContent pattern
    let name = lead.firstName && lead.lastName ? `${lead.firstName} ${lead.lastName}` : undefined;
    if (!name && lead.postContent) {
      const authorMatch = lead.postContent.match(/Author:\s*([^(\n]+)/i);
      if (authorMatch && authorMatch[1]) {
        name = authorMatch[1].trim();
      }
    }

    const apolloData = await apolloService.enrichLead(lead.profileUrl, name);
    
    if (apolloData && apolloData.person) {
      const person = apolloData.person;
      const emails = [];
      if (person.email) emails.push(person.email);
      if (person.personal_emails && person.personal_emails.length > 0) {
        emails.push(...person.personal_emails);
      }

      const phoneNumbers = person.phone_numbers ? person.phone_numbers.map((p: any) => p.sanitized_number) : [];

      lead.firstPersonalEmail = emails[0] || undefined;
      lead.allEmails = Array.from(new Set(emails));
      lead.firstName = person.first_name || lead.firstName;
      lead.lastName = person.last_name || lead.lastName;
      lead.phones = phoneNumbers;
      lead.apolloEnrichmentAttempted = true;

      await lead.save();

      const hasContactInfo = emails.length > 0 || phoneNumbers.length > 0;

      return NextResponse.json({ 
        message: hasContactInfo ? 'Contact info fetched successfully!' : 'Profile matched, but no contact info found.', 
        lead 
      });
    } else {
      lead.apolloEnrichmentAttempted = true;
      await lead.save();

      return NextResponse.json({ 
        message: 'Apollo request succeeded but no person match found for this profile.', 
        lead 
      });
    }

  } catch (error: any) {
    console.error('Lead Enrichment Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
