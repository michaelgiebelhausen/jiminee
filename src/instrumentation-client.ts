// Client-side Sentry init (runs in the worker's browser).
// PII scrubbing here too — worker phone numbers must never leave the client (PRD § Security).
import * as Sentry from "@sentry/nextjs";
import { scrubEvent } from "@/lib/sentry-scrub";

Sentry.init({
  dsn: "https://d99d4aa8c85a60d02c4d40f723d22118@o4511724754763776.ingest.us.sentry.io/4511724758564864",

  tracesSampleRate: 0.1,
  enableLogs: true,

  beforeSend: scrubEvent,

  dataCollection: {
    userInfo: false,
    httpBodies: [],
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
