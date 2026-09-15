export const STAFF_NAMES = [
  "Andrew Khadder",
  "Ryan Hoang",
  "Maya Chen",
  "Jenny Park",
] as const;

export type StaffName = (typeof STAFF_NAMES)[number];

export const EVENT_ROLES = [
  "Welcome guests at the door",
  "Serve drinks",
  "Manage pastries",
  "Photograph the event",
] as const;

export type EventRole = (typeof EVENT_ROLES)[number];

export interface RoleAssignment {
  name: StaffName;
  role: EventRole;
}

const SEED_ROLES: readonly RoleAssignment[] = [
  { name: "Andrew Khadder", role: "Welcome guests at the door" },
  { name: "Ryan Hoang", role: "Serve drinks" },
  { name: "Maya Chen", role: "Manage pastries" },
  { name: "Jenny Park", role: "Photograph the event" },
];

let roleAssignments = copyAssignments(SEED_ROLES);

function copyAssignments(
  assignments: readonly RoleAssignment[]
): RoleAssignment[] {
  return assignments.map((assignment) => ({ ...assignment }));
}

export function resetRoles(): void {
  roleAssignments = copyAssignments(SEED_ROLES);
}

export function getRoles(names?: readonly StaffName[]): RoleAssignment[] {
  if (names === undefined) return copyAssignments(roleAssignments);
  const selected = new Set(names);
  return copyAssignments(
    roleAssignments.filter(({ name }) => selected.has(name))
  );
}

export function updateRoles(
  updates: readonly RoleAssignment[]
): {
  previousRoles: RoleAssignment[];
  roles: RoleAssignment[];
  changed: boolean;
} {
  const previousRoles = copyAssignments(roleAssignments);
  const updatesByName = new Map(
    updates.map(({ name, role }) => [name, role] as const)
  );

  roleAssignments = roleAssignments.map((assignment) => ({
    ...assignment,
    role: updatesByName.get(assignment.name) ?? assignment.role,
  }));

  return {
    previousRoles,
    roles: copyAssignments(roleAssignments),
    changed: previousRoles.some(
      (assignment, index) =>
        assignment.role !== roleAssignments[index]?.role
    ),
  };
}
