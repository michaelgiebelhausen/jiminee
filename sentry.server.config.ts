// Server-side Sentry init.
// PII scrubbing (beforeSend + dataCollection) is a PRD § Security requirement:
// Jiminee must never leak request bodies, auth headers, or worker phone numbers.
import * as Sentry from "@sentry/nextjs";
import { scrubEvent } from "./src/lib/sentry-scrub";

Sentry.init({
  dsn: "https://d99d4aa8c85a60d02c4d40f723d22118@o4511724754763776.ingest.us.sentry.io/4511724758564864",

  tracesSampleRate: 0.1,
  enableLogs: true,

  // Regex-scrubs phone numbers from messages/breadcrumbs and drops request bodies,
  // cookies, and auth headers before anything is sent.
  beforeSend: scrubEvent,

  dataCollection: {
    userInfo: false,
    httpBodies: [],
  },
});
