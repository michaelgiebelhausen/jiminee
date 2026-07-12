/**
 * Live AI smoke test (TASK-031, founder-run): generates steps for a realistic task
 * against the REAL Anthropic API using the seeded workplace brief, and prints them.
 *
 * Usage: npx tsx --conditions react-server scripts/smoke-ai.ts
 * (requires OPENROUTER_API_KEY in .env.local; the react-server condition satisfies "server-only")
 */
import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  if (!process.env.OPENROUTER_API_KEY) {
    console.error("Set OPENROUTER_API_KEY in .env.local first.");
    process.exit(1);
  }
  const { generateStepsStream } = await import("../src/lib/ai/steps");

  const ctx = {
    title: "Restock the printer in Brackett 214",
    description: null,
    location: "Brackett 214",
    estimatedMinutes: 15,
    brief: {
      locations: "Mail room: 3rd floor next to elevator. Supply closet: across from mail room. Printer: Brackett 214.",
      systems: "Copier code taped inside supply closet door.",
      supplies: "Toner on second shelf of supply closet, labeled by model.",
      contacts: "Facilities: ext 5501. IT helpdesk: ext 4357.",
      notes: "Building doors lock at 6pm.",
    },
  };

  let out = "";
  for await (const chunk of generateStepsStream(ctx)) {
    process.stdout.write(chunk);
    out += chunk;
  }
  const grounded = /supply closet|second shelf|Brackett|mail room/i.test(out);
  console.log(`\n\nGrounding check (mentions brief facts): ${grounded ? "PASS" : "FAIL"}`);
  process.exit(grounded ? 0 : 1);
}

main();
