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

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://sacrifice-palm-compost.ngrok-free.dev');
    const webhookUrl = `${baseUrl}/api/webhooks/apollo-phone?leadId=${lead._id}`;

    const apolloData = await apolloService.enrichLeadPhone(lead.profileUrl, name, webhookUrl);
    
    if (apolloData && apolloData.person) {
      const person = apolloData.person;

      const phoneNumbers = person.phone_numbers ? person.phone_numbers.map((p: any) => p.sanitized_number) : [];

      if (phoneNumbers.length > 0) {
        lead.phones = [...new Set([...(lead.phones || []), ...phoneNumbers])];
        lead.firstName = person.first_name || lead.firstName;
        lead.lastName = person.last_name || lead.lastName;
        lead.apolloPhoneEnrichmentRequested = true;
        await lead.save();

        return NextResponse.json({ 
          message: 'Phone number fetched successfully from cache!', 
          lead 
        });
      } else {
        lead.apolloPhoneEnrichmentRequested = true;
        await lead.save();
        return NextResponse.json({ 
          message: 'Phone enrichment queued. It may take a few minutes for the number to appear on this page.', 
          lead 
        });
      }
    } else {
      lead.apolloPhoneEnrichmentRequested = true;
      await lead.save();
      return NextResponse.json({ 
        message: 'Phone enrichment queued. It may take a few minutes for the number to appear on this page.', 
        lead 
      });
    }

  } catch (error: any) {
    console.error('Lead Phone Enrichment Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
