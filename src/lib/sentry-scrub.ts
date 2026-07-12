import type { ErrorEvent } from "@sentry/core";

// PRD § Security: Sentry events must never carry request bodies, auth headers,
// or phone numbers. Applied via beforeSend on client, server, and edge.
const E164 = /\+?\d{10,15}/g;

export function scrubEvent(event: ErrorEvent): ErrorEvent {
  if (event.request) {
    delete event.request.data;
    delete event.request.cookies;
    delete event.request.headers;
  }
  if (event.user) {
    event.user = { id: event.user.id }; // keep pseudonymous id only
  }
  const scrub = (s: string | undefined) => s?.replace(E164, "[phone]");
  if (event.message) event.message = scrub(event.message);
  for (const ex of event.exception?.values ?? []) {
    ex.value = scrub(ex.value);
  }
  for (const crumb of event.breadcrumbs ?? []) {
    crumb.message = scrub(crumb.message);
    delete crumb.data;
  }
  return event;
}
