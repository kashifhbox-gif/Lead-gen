import { serve } from "inngest/next";
import { inngest } from "@/app/lib/inngest";
import { evaluateLeads, enrichCampaignLeads } from "@/app/inngest/functions";

// Create an API that serves zero-downtime background jobs
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    evaluateLeads,
    enrichCampaignLeads,
  ],
});
