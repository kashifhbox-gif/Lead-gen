import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/lib/db';
import Lead from '@/app/models/Lead';

export async function POST(request: Request) {
  let leadId: string | null = null;
  try {
    const { searchParams } = new URL(request.url);
    leadId = searchParams.get('leadId');

    const body = await request.json();
    console.log('Apollo Phone Webhook payload:', JSON.stringify(body, null, 2));

    await connectToDatabase();
    
    // Extract person data from Apollo webhook payload
    const person = body.contact || body.person || body;
    
    let lead;
    if (leadId) {
      lead = await Lead.findById(leadId);
    } else if (person && person.linkedin_url) {
      lead = await Lead.findOne({ profileUrl: person.linkedin_url });
    }

    if (!lead) {
      return NextResponse.json({ message: 'Lead not found' }, { status: 404 });
    }


    if (person && person.phone_numbers) {
      const phoneNumbers = person.phone_numbers.map((p: any) => p.sanitized_number || p.raw_number).filter(Boolean);

      if (phoneNumbers.length > 0) {
        lead.phones = [...new Set([...(lead.phones || []), ...phoneNumbers])];
        if (person.first_name) lead.firstName = person.first_name;
        if (person.last_name) lead.lastName = person.last_name;
        console.log(`Updated lead ${leadId} with phones:`, phoneNumbers);
      }
    }

    lead.apolloPhoneEnrichmentRequested = false;
    lead.apolloEmailEnrichmentRequested = false;
    await lead.save();

    return NextResponse.json({ message: 'Webhook processed successfully' });

  } catch (error: any) {
    console.error('Apollo Phone Webhook Error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
