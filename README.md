# Blossom MCP

Blossom is a small, deterministic MCP v2 event-registration server for the fictional **Blossom Hill Cafe** pop-up. It is built with the current `mcp-use` v2 API and includes native MCP App views for the event overview, registration detail, and status-update result.

Suggested opening line:

> Hey Codex, our Blossom Hill Cafe pop-up is in a month. Use Blossom to pull up the event information.

## Tool surface

Blossom exposes exactly four tools:

- `get_event_overview` — shallow event facts and a polished event card. Its `confirmedCount` is an explicit 150-person demo estimate (`confirmedCountBasis: "demo_estimate"`).
- `list_registrations` — confirmed by default, explicit field selection, and pagination. It returns rows only; the model computes counts and aggregates.
- `get_registration` — exact individual lookup by ID, full name, or email. Julian Estrada is initially waitlisted.
- `update_registration_status` — an idempotent local write with the updated registration and a result card.

There is intentionally no `summarize_registrations` tool. Slack, Custom Ink, Notion, purchase simulation, and notification watching are also outside this server.

## Seed data and privacy

The in-memory seed contains 12 confirmed fictional attendees and one waitlisted attendee, Julian Estrada. Confirmed attendees include T-shirt sizes, drink preferences, dietary restrictions, and allergies. Data resets whenever the server process restarts.

The event overview deliberately displays **150 estimated confirmed guests** for the demo without manufacturing 150 registration rows. This presentation estimate is independent of the seed dataset and is identified by `confirmedCountBasis: "demo_estimate"`. Counts, pagination, allergy summaries, and T-shirt aggregates derived from `list_registrations` continue to use only the small seed dataset (12 confirmed initially, or 13 after Julian is confirmed).

For privacy-safe allergy aggregation, call `list_registrations` with:

```json
{
  "status": "confirmed",
  "fields": ["allergies"]
}
```

This omits names and emails. The model should flatten and deduplicate the returned values itself. Individual lookup remains available when explicitly needed.

For T-shirt counts, use:

```json
{
  "status": "confirmed",
  "fields": ["tshirtSize"]
}
```

## Requirements

- Node.js 22.22.2 or newer
- npm 10 or newer

## Install and run

```bash
npm install
npm run dev
```

The MCP endpoint is:

```text
http://localhost:3000/mcp
```

`mcp-use dev` owns the HTTP listener, discovers `views/*/view.tsx`, and serves the app assets. To create and run a production build:

```bash
npm run build
npm start
```

Useful validation commands:

```bash
npm run typecheck
npm test
npm run verify
```

## Demo sequence

1. Call `get_event_overview`.
2. Call `list_registrations` with only the fields needed for an allergy or T-shirt aggregate.
3. If Jenny raises Julian’s RSVP, call `get_registration` with `{"query":"Julian Estrada"}`.
4. After clear user instruction to accept him, call `update_registration_status` with `{"query":"Julian Estrada","status":"confirmed"}`.

The write is process-local and intentionally deterministic: restarting Blossom restores Julian to `waitlisted`.
