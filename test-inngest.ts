import { inngest } from "./app/lib/inngest";

export const evaluateLeads = inngest.createFunction(
  { 
    id: "evaluate-leads-job",
    triggers: [{ event: "app/evaluate.leads" }]
  },
  async ({ event, step }) => {
     return true;
  }
);
