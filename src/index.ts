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
import {
  EVENT_ROLES,
  getRoles as readRoles,
  STAFF_NAMES,
  updateRoles as writeRoles,
} from "./roles.js";
import {
  isSlackAgent,
  loadSlackControllerConfig,
  postDemoMessage,
  resetDemoMessages,
  SLACK_CONTROLLER_HTML,
  type SlackAgent,
} from "./slack-controller.js";
import {
  componentsToSpec,
  uiComponentSchema,
  uiSpecSchema,
} from "./ui-catalog.js";

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

const roleAssignmentSchema = z.object({
  name: z.enum(STAFF_NAMES),
  role: z.enum(EVENT_ROLES),
});

const rolesOutputSchema = z.object({
  roles: z.array(roleAssignmentSchema),
});

const uniqueRoleUpdatesSchema = z
  .array(roleAssignmentSchema)
  .min(1)
  .max(STAFF_NAMES.length)
  .superRefine((updates, context) => {
    const names = new Set<string>();
    for (const update of updates) {
      if (names.has(update.name)) {
        context.addIssue({
          code: "custom",
          message: `Include ${update.name} only once.`,
        });
      }
      names.add(update.name);
    }
  });

const server = new MCPServer({
  name: "blossom",
  title: "Blossom",
  version: "1.0.0",
  description:
    "A deterministic fictional event-registration service for the Blossom Hill Cafe pop-up.",
  basePath: "/mcp",
});

const slackCooldowns = new Map<SlackAgent, number>();
const SLACK_COOLDOWN_MS = 2_000;

server.get("/demo/slack", (context) => {
  try {
    const config = loadSlackControllerConfig();
    if (context.req.query("key") !== config.controllerKey) {
      return context.text("Not found", 404);
    }
    return context.html(SLACK_CONTROLLER_HTML);
  } catch {
    return context.text("Slack demo controller is not configured", 503);
  }
});

server.post("/demo/slack/send/:agent", async (context) => {
  const agent = context.req.param("agent");
  if (!isSlackAgent(agent)) {
    return context.json({ ok: false, error: "Unknown agent" }, 404);
  }

  let config;
  try {
    config = loadSlackControllerConfig();
  } catch {
    return context.json({ ok: false, error: "Controller is not configured" }, 503);
  }
  if (context.req.header("x-blossom-controller-key") !== config.controllerKey) {
    return context.json({ ok: false, error: "Not authorized" }, 401);
  }

  const now = Date.now();
  if (now - (slackCooldowns.get(agent) ?? 0) < SLACK_COOLDOWN_MS) {
    return context.json({ ok: false, error: "Please wait before sending again" }, 429);
  }

  slackCooldowns.set(agent, now);
  try {
    await postDemoMessage(agent, config);
    return context.json({ ok: true, agent });
  } catch (error) {
    slackCooldowns.delete(agent);
    console.error(`Failed to post as ${agent}:`, error);
    return context.json({ ok: false, error: "Slack did not accept the message" }, 502);
  }
});

server.post("/demo/slack/reset", async (context) => {
  let config;
  try {
    config = loadSlackControllerConfig();
  } catch {
    return context.json({ ok: false, error: "Controller is not configured" }, 503);
  }
  if (context.req.header("x-blossom-controller-key") !== config.controllerKey) {
    return context.json({ ok: false, error: "Not authorized" }, 401);
  }

  try {
    const deleted = await resetDemoMessages(config);
    return context.json({ ok: true, deleted });
  } catch (error) {
    console.error("Failed to reset Slack demo messages:", error);
    return context.json({ ok: false, error: "Slack demo reset failed" }, 502);
  }
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

export const getRoles = server.tool(
  {
    name: "get_roles",
    title: "Get event roles",
    description:
      "Get the current Blossom Hill Cafe staff assignments. Omit names to return everyone. Use this before generate_ui when the user asks to see the team or event roles.",
    inputSchema: z.object({
      names: z
        .array(z.enum(STAFF_NAMES))
        .min(1)
        .optional()
        .describe("Optional people to include; omit to return the full team."),
    }),
    outputSchema: rolesOutputSchema,
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  async ({ names }) => {
    const roles = readRoles(names);
    return {
      content: [{
        type: "text",
        text: roles
          .map(({ name, role }) => `${name}: ${role}`)
          .join("\n"),
      }],
      structuredContent: { roles },
    };
  }
);

const updateRolesOutputSchema = z.object({
  previousRoles: z.array(roleAssignmentSchema),
  roles: z.array(roleAssignmentSchema),
  changed: z.boolean(),
});

export const updateRoles = server.tool(
  {
    name: "update_roles",
    title: "Update event roles",
    description:
      "Atomically update one or more Blossom Hill Cafe staff assignments. To switch two people, include both people with each other's current role in one call. After a successful update, call generate_ui again when the user is looking at a generated roles UI.",
    inputSchema: z.object({
      updates: uniqueRoleUpdatesSchema.describe(
        "Complete set of role changes to apply together."
      ),
    }),
    outputSchema: updateRolesOutputSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async ({ updates }) => {
    const result = writeRoles(updates);
    return {
      content: [{
        type: "text",
        text: result.changed
          ? `Updated ${updates.length} event role${updates.length === 1 ? "" : "s"}.`
          : "Those event roles were already assigned; no change was needed.",
      }],
      structuredContent: result,
    };
  }
);

const generatedUiOutputSchema = z.object({
  spec: uiSpecSchema,
});

const generatedUiInputSchema = z
  .object({
    root: z
      .string()
      .min(1)
      .describe("Key of the root Canvas component."),
    components: z
      .array(uiComponentSchema)
      .min(1)
      .max(60)
      .describe(
        "Flat components in parent-first render order. The host streams this array to the view as it is generated."
      ),
  })
  .superRefine(({ root, components }, context) => {
    const keys = new Set<string>();
    for (const [index, component] of components.entries()) {
      if (keys.has(component.key)) {
        context.addIssue({
          code: "custom",
          path: ["components", index, "key"],
          message: `Duplicate component key: ${component.key}`,
        });
      }
      keys.add(component.key);
    }

    const rootComponent = components.find(({ key }) => key === root);
    if (rootComponent?.type !== "Canvas") {
      context.addIssue({
        code: "custom",
        path: ["root"],
        message: "root must identify a Canvas component.",
      });
    }
    if (components[0]?.key !== root) {
      context.addIssue({
        code: "custom",
        path: ["components", 0, "key"],
        message: "The root Canvas must be the first streamed component.",
      });
    }

    for (const [index, component] of components.entries()) {
      for (const child of component.children) {
        if (!keys.has(child)) {
          context.addIssue({
            code: "custom",
            path: ["components", index, "children"],
            message: `Unknown child component key: ${child}`,
          });
        }
      }
    }
  });

export const generateUi = server.tool(
  {
    name: "generate_ui",
    title: "Generate custom UI",
    description:
      "Generate a read-only custom UI that renders in real time while JSON components stream into this tool's input. First get source data with the appropriate Blossom tool. Then provide root plus a parent-first components array using exactly one Canvas root and only Canvas, Card, Grid, Stack, Heading, Text, Badge, Avatar, Metric, Table, and Divider. Put the root Canvas first so it appears immediately; order each parent before its children. Use literal props from source data. Every component needs a unique key, props, and children; leaf components use an empty children array.",
    inputSchema: generatedUiInputSchema,
    outputSchema: generatedUiOutputSchema,
    annotations: { readOnlyHint: true, openWorldHint: false },
    view: {
      name: "generated-ui",
      description:
        "A safe model-composed UI rendered from the Blossom presentation catalog.",
      prefersBorder: false,
    },
  },
  async ({ root, components }) => {
    const spec = componentsToSpec(root, components);
    return {
      content: [{
        type: "text",
        text: `Rendered a custom UI with ${components.length} components.`,
      }],
      structuredContent: { spec },
    };
  }
);

export default server;
