export const REGISTRATION_STATUSES = [
  "confirmed",
  "waitlisted",
  "cancelled",
] as const;
export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];

export const REGISTRATION_FIELDS = [
  "id",
  "name",
  "email",
  "status",
  "tshirtSize",
  "drinkPreference",
  "dietaryRestrictions",
  "allergies",
] as const;
export type RegistrationField = (typeof REGISTRATION_FIELDS)[number];

export interface Registration {
  id: string;
  name: string;
  email: string;
  status: RegistrationStatus;
  tshirtSize: "XS" | "S" | "M" | "L" | "XL" | "2XL" | null;
  drinkPreference: string | null;
  dietaryRestrictions: string[];
  allergies: string[];
}

export interface EventOverview {
  id: string;
  name: string;
  date: string;
  time: string;
  timeZone: string;
  location: string;
  confirmedCount: number;
  confirmedCountBasis: "demo_estimate";
  planningStatus: string;
  theme: {
    background: string;
    accent: string;
    motif: string;
  };
}

export const EVENT = {
  id: "blossom-hill-cafe-2026",
  name: "Blossom Hill Cafe",
  date: "August 26, 2026",
  time: "6:00–9:00 PM",
  timeZone: "America/Los_Angeles",
  location: "The Glasshouse · 84 Orchard Lane · San Jose, CA",
  displayedConfirmedCount: 150,
  planningStatus: "Finalizing guest details",
  theme: {
    background: "sunset garden",
    accent: "#E85D3F",
    motif: "California poppies and café lights",
  },
} as const;

const SEED_REGISTRATIONS: readonly Registration[] = [
  { id: "reg-001", name: "Jenny Park", email: "jenny.park@example.test", status: "confirmed", tshirtSize: "S", drinkPreference: "Oat milk latte", dietaryRestrictions: ["Vegetarian"], allergies: [] },
  { id: "reg-002", name: "Maya Chen", email: "maya.chen@example.test", status: "confirmed", tshirtSize: "M", drinkPreference: "Sparkling yuzu", dietaryRestrictions: ["No alcohol"], allergies: ["Peanut"] },
  { id: "reg-003", name: "Luis Ortega", email: "luis.ortega@example.test", status: "confirmed", tshirtSize: "L", drinkPreference: "Cold brew", dietaryRestrictions: [], allergies: [] },
  { id: "reg-004", name: "Aisha Rahman", email: "aisha.rahman@example.test", status: "confirmed", tshirtSize: "M", drinkPreference: "Cardamom oat latte", dietaryRestrictions: ["Halal", "No alcohol"], allergies: ["Tree nut"] },
  { id: "reg-005", name: "Noah Williams", email: "noah.williams@example.test", status: "confirmed", tshirtSize: "XL", drinkPreference: "Ginger spritz", dietaryRestrictions: [], allergies: [] },
  { id: "reg-006", name: "Sofia Alvarez", email: "sofia.alvarez@example.test", status: "confirmed", tshirtSize: "S", drinkPreference: "Hibiscus iced tea", dietaryRestrictions: ["Vegan"], allergies: ["Dairy"] },
  { id: "reg-007", name: "Ethan Kim", email: "ethan.kim@example.test", status: "confirmed", tshirtSize: "L", drinkPreference: "Espresso tonic", dietaryRestrictions: [], allergies: [] },
  { id: "reg-008", name: "Priya Shah", email: "priya.shah@example.test", status: "confirmed", tshirtSize: "XS", drinkPreference: "Masala chai", dietaryRestrictions: ["Vegetarian"], allergies: ["Sesame"] },
  { id: "reg-009", name: "Marcus Green", email: "marcus.green@example.test", status: "confirmed", tshirtSize: "2XL", drinkPreference: "Decaf cappuccino", dietaryRestrictions: [], allergies: [] },
  { id: "reg-010", name: "Chloe Martin", email: "chloe.martin@example.test", status: "confirmed", tshirtSize: "M", drinkPreference: "Lavender lemonade", dietaryRestrictions: ["Gluten-free"], allergies: [] },
  { id: "reg-011", name: "Owen Brooks", email: "owen.brooks@example.test", status: "confirmed", tshirtSize: "L", drinkPreference: "Pilsner", dietaryRestrictions: [], allergies: [] },
  { id: "reg-012", name: "Nia Thompson", email: "nia.thompson@example.test", status: "confirmed", tshirtSize: "XL", drinkPreference: "Peach iced tea", dietaryRestrictions: ["No alcohol"], allergies: ["Soy"] },
  { id: "reg-013", name: "Julian Estrada", email: "julian.estrada@example.test", status: "waitlisted", tshirtSize: "L", drinkPreference: "Americano", dietaryRestrictions: [], allergies: [] },
];

let registrations = SEED_REGISTRATIONS.map(copyRegistration);

function copyRegistration(registration: Registration): Registration {
  return {
    ...registration,
    dietaryRestrictions: [...registration.dietaryRestrictions],
    allergies: [...registration.allergies],
  };
}

export function resetRegistrations(): void {
  registrations = SEED_REGISTRATIONS.map(copyRegistration);
}

export function getEventOverview(): EventOverview {
  return {
    id: EVENT.id,
    name: EVENT.name,
    date: EVENT.date,
    time: EVENT.time,
    timeZone: EVENT.timeZone,
    location: EVENT.location,
    planningStatus: EVENT.planningStatus,
    theme: { ...EVENT.theme },
    confirmedCount: EVENT.displayedConfirmedCount,
    confirmedCountBasis: "demo_estimate",
  };
}

export function listRegistrations(options: {
  status?: RegistrationStatus | "all";
  fields?: RegistrationField[];
  page?: number;
  pageSize?: number;
}): {
  registrations: Record<string, unknown>[];
  page: number;
  pageSize: number;
  total: number;
  hasNextPage: boolean;
} {
  const status = options.status ?? "confirmed";
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 25;
  const fields = options.fields ?? ["id", "name", "status"];
  const filtered =
    status === "all"
      ? registrations
      : registrations.filter((registration) => registration.status === status);
  const start = (page - 1) * pageSize;
  const rows = filtered.slice(start, start + pageSize).map((registration) =>
    Object.fromEntries(fields.map((field) => [field, copyRegistration(registration)[field]]))
  );
  return {
    registrations: rows,
    page,
    pageSize,
    total: filtered.length,
    hasNextPage: start + pageSize < filtered.length,
  };
}

export function findRegistration(query: string): Registration | undefined {
  const normalized = query.trim().toLowerCase();
  const match = registrations.find(
    ({ id, name, email }) =>
      id.toLowerCase() === normalized ||
      name.toLowerCase() === normalized ||
      email.toLowerCase() === normalized
  );
  return match === undefined ? undefined : copyRegistration(match);
}

export function updateRegistrationStatus(
  query: string,
  status: RegistrationStatus
): { previousStatus: RegistrationStatus; registration: Registration } | undefined {
  const existing = findRegistration(query);
  if (existing === undefined) return undefined;
  const index = registrations.findIndex(({ id }) => id === existing.id);
  const previousStatus = existing.status;
  registrations[index] = { ...existing, status };
  return { previousStatus, registration: copyRegistration(registrations[index]!) };
}
