import { NextResponse } from 'next/server';
import connectToDatabase from '@/app/lib/db';
import Lead from '@/app/models/Lead';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Apollo Bulk Webhook payload:', JSON.stringify(body, null, 2));

    await connectToDatabase();
    
    // Apollo bulk webhook returns an array of people
    const people = body.matches || body.people || [];

    for (const person of people) {
      if (person && person.linkedin_url) {
        // Find the lead by LinkedIn URL
        const lead = await Lead.findOne({ profileUrl: person.linkedin_url });
        
        if (lead) {
          let updated = false;

          // Extract emails
          const emails = [];
          if (person.email) emails.push(person.email);
          if (person.personal_emails && person.personal_emails.length > 0) {
            emails.push(...person.personal_emails);
          }
          
          if (emails.length > 0) {
            lead.firstPersonalEmail = emails[0];
            lead.allEmails = Array.from(new Set([...(lead.allEmails || []), ...emails]));
            updated = true;
          }

          // Extract phones
          if (person.phone_numbers) {
            const phoneNumbers = person.phone_numbers.map((p: any) => p.sanitized_number || p.raw_number).filter(Boolean);
            if (phoneNumbers.length > 0) {
              lead.phones = [...new Set([...(lead.phones || []), ...phoneNumbers])];
              updated = true;
            }
          }

          if (person.first_name) lead.firstName = person.first_name;
          if (person.last_name) lead.lastName = person.last_name;

          lead.apolloPhoneEnrichmentRequested = false;
          lead.apolloEmailEnrichmentRequested = false;
          lead.apolloEnrichmentAttempted = true;
          
          await lead.save();
          console.log(`Updated lead ${lead._id} from bulk webhook`);
        }
      }
    }

    // Also clear spinners for any leads that were not matched if we have a way to identify them,
    // but bulk API doesn't echo back unmatched items clearly in the webhook.
    // The timeout fallback handles clearing the spinners.

    return NextResponse.json({ message: 'Bulk Webhook processed successfully' });

  } catch (error: any) {
    console.error('Apollo Bulk Webhook Error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
