import { MCPServer } from "mcp-use";
import { z } from "zod";
import {
  findRegistration,
  getEventOverview as readEventOverview,
  listRegistrations as readRegistrations,
  REGISTRATION_FIELDS,
  REGISTRATION_STATUSES,
  updateRegistrationStatus as writeRegistrationStatus,
} from "./data.js";

const registrationSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  status: z.enum(REGISTRATION_STATUSES),
  tshirtSize: z.enum(["XS", "S", "M", "L", "XL", "2XL"]).nullable(),
  drinkPreference: z.string().nullable(),
  dietaryRestrictions: z.array(z.string()),
  allergies: z.array(z.string()),
});

const overviewSchema = z.object({
  id: z.string(),
  name: z.string(),
  date: z.string(),
  time: z.string(),
  timeZone: z.string(),
  location: z.string(),
  confirmedCount: z.number(),
  confirmedCountBasis: z.literal("demo_estimate"),
  planningStatus: z.string(),
  theme: z.object({
    background: z.string(),
    accent: z.string(),
    motif: z.string(),
  }),
});

const server = new MCPServer({
  name: "blossom",
  title: "Blossom",
  version: "1.0.0",
  description:
    "A deterministic fictional event-registration service for the Blossom Hill Cafe pop-up.",
  basePath: "/mcp",
});

export const getEventOverview = server.tool(
  {
    name: "get_event_overview",
    title: "Get event overview",
    description:
      "Get shallow facts for the Blossom Hill Cafe event: name, date, time, location, a 150-person displayed demo estimate for confirmed guests, planning status, and visual theme. The estimate is independent of the small registration seed; use list_registrations for dataset-derived counts. Use this first when the user asks to pull up event information.",
    inputSchema: z.object({}),
    outputSchema: overviewSchema,
    annotations: { readOnlyHint: true, openWorldHint: false },
    view: {
      name: "event-overview",
      description: "A polished event card for the Blossom Hill Cafe pop-up.",
      prefersBorder: false,
    },
  },
  async () => {
    const overview = readEventOverview();
    return {
      content: [{
        type: "text",
        text: `${overview.name} is ${overview.date}, ${overview.time} at ${overview.location}. The displayed demo estimate is ${overview.confirmedCount} confirmed guests; use list_registrations for counts derived from the small seed dataset. Planning status: ${overview.planningStatus}.`,
      }],
      structuredContent: overview,
    };
  }
);

const registrationFieldSchema = z.enum(REGISTRATION_FIELDS);
const listOutputSchema = z.object({
  registrations: z.array(z.record(z.string(), z.unknown())),
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
  hasNextPage: z.boolean(),
});

export const listRegistrations = server.tool(
  {
    name: "list_registrations",
    title: "List registrations",
    description:
      "List registrations for model-side counting and aggregation. Defaults to confirmed registrations and only id, name, and status. Select only fields needed for the task. For privacy-safe allergy aggregation, request only `allergies` (not `name` or `email`); individual lookup is handled by get_registration. This tool returns raw rows and pagination only—compute all counts and aggregates yourself.",
    inputSchema: z.object({
      status: z.enum([...REGISTRATION_STATUSES, "all"]).default("confirmed").describe("RSVP status filter; defaults to confirmed."),
      fields: z.array(registrationFieldSchema).min(1).default(["id", "name", "status"]).describe("Focused fields to return. Request only what the task requires."),
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(25),
    }),
    outputSchema: listOutputSchema,
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  async (input) => {
    const result = readRegistrations(input);
    return {
      content: [{
        type: "text",
        text: `Returned ${result.registrations.length} of ${result.total} matching registrations (page ${result.page}). Compute any requested totals or aggregates from the rows.`,
      }],
      structuredContent: result,
    };
  }
);

export const getRegistration = server.tool(
  {
    name: "get_registration",
    title: "Get registration",
    description:
      "Look up one fictional attendee by exact registration ID, full name, or email. Individual lookup is allowed and is the right tool for checking Julian Estrada's waitlisted registration.",
    inputSchema: z.object({
      query: z.string().min(1).describe("Exact registration ID, full name, or email address."),
    }),
    outputSchema: registrationSchema,
    annotations: { readOnlyHint: true, openWorldHint: false },
    view: {
      name: "registration-detail",
      description: "A focused registration detail card.",
      prefersBorder: false,
    },
  },
  async ({ query }) => {
    const registration = findRegistration(query);
    if (registration === undefined) {
      return {
        isError: true,
        content: [{ type: "text", text: `No registration found for “${query}”.` }],
      };
    }
    return {
      content: [{
        type: "text",
        text: `${registration.name} (${registration.id}) is ${registration.status}.`,
      }],
      structuredContent: registration,
    };
  }
);

const updateOutputSchema = z.object({
  previousStatus: z.enum(REGISTRATION_STATUSES),
  changed: z.boolean(),
  registration: registrationSchema,
});

export const updateRegistrationStatus = server.tool(
  {
    name: "update_registration_status",
    title: "Update registration status",
    description:
      "Safely change one fictional attendee's RSVP status by exact registration ID, full name, or email. Use after the user clearly asks to accept, confirm, waitlist, or cancel that individual.",
    inputSchema: z.object({
      query: z.string().min(1).describe("Exact registration ID, full name, or email address."),
      status: z.enum(REGISTRATION_STATUSES).describe("New RSVP status."),
    }),
    outputSchema: updateOutputSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    view: {
      name: "registration-status",
      description: "Confirmation card for an RSVP status update.",
      prefersBorder: false,
    },
  },
  async ({ query, status }) => {
    const update = writeRegistrationStatus(query, status);
    if (update === undefined) {
      return {
        isError: true,
        content: [{ type: "text", text: `No registration found for “${query}”. No changes were made.` }],
      };
    }
    const changed = update.previousStatus !== status;
    return {
      content: [{
        type: "text",
        text: changed
          ? `${update.registration.name} moved from ${update.previousStatus} to ${status}.`
          : `${update.registration.name} was already ${status}; no change was needed.`,
      }],
      structuredContent: { ...update, changed },
    };
  }
);

export default server;
