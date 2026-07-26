import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import {
  findRegistration,
  getEventOverview,
  listRegistrations,
  resetRegistrations,
  updateRegistrationStatus,
} from "../src/data.js";
import {
  getEventOverview as overviewTool,
  getRegistration,
  listRegistrations as listTool,
  updateRegistrationStatus as updateTool,
} from "../src/index.js";

beforeEach(resetRegistrations);
afterEach(resetRegistrations);

describe("Blossom tool surface", () => {
  it("exports exactly the four agreed tool references", () => {
    assert.deepEqual(
      [overviewTool.name, listTool.name, getRegistration.name, updateTool.name].sort(),
      [
        "get_event_overview",
        "get_registration",
        "list_registrations",
        "update_registration_status",
      ]
    );
  });
});

describe("event overview", () => {
  it("returns deterministic shallow event facts and an explicit demo estimate", () => {
    const overview = getEventOverview();
    assert.equal(overview.name, "Blossom Hill Cafe");
    assert.equal(overview.date, "August 26, 2026");
    assert.equal(overview.confirmedCount, 150);
    assert.equal(overview.confirmedCountBasis, "demo_estimate");
    assert.equal(overview.planningStatus, "Finalizing guest details");
  });
});

describe("registration listing", () => {
  it("defaults to confirmed registrations and focused identity fields", () => {
    const result = listRegistrations({});
    assert.equal(result.total, 12);
    assert.equal(result.registrations.length, 12);
    assert.deepEqual(Object.keys(result.registrations[0]!), ["id", "name", "status"]);
    assert.ok(result.registrations.every(({ status }) => status === "confirmed"));
  });

  it("supports field selection and pagination without server-side aggregates", () => {
    const page = listRegistrations({
      fields: ["tshirtSize"],
      page: 2,
      pageSize: 5,
    });
    assert.equal(page.total, 12);
    assert.equal(page.registrations.length, 5);
    assert.equal(page.hasNextPage, true);
    assert.deepEqual(Object.keys(page.registrations[0]!), ["tshirtSize"]);
    assert.equal("counts" in page, false);
  });

  it("supports privacy-safe allergy retrieval without attendee identity", () => {
    const result = listRegistrations({ fields: ["allergies"] });
    assert.ok(result.registrations.every((row) => !("name" in row) && !("email" in row)));
    assert.deepEqual(
      result.registrations.flatMap(({ allergies }) => allergies as string[]),
      ["Peanut", "Tree nut", "Dairy", "Sesame", "Soy"]
    );
  });
});

describe("individual lookup and safe status updates", () => {
  it("finds waitlisted Julian by name", () => {
    const julian = findRegistration("Julian Estrada");
    assert.equal(julian?.id, "reg-013");
    assert.equal(julian?.status, "waitlisted");
    assert.equal(julian?.tshirtSize, "L");
  });

  it("confirms Julian in the dataset without changing the overview estimate", () => {
    const update = updateRegistrationStatus("Julian Estrada", "confirmed");
    assert.equal(update?.previousStatus, "waitlisted");
    assert.equal(update?.registration.status, "confirmed");
    assert.equal(listRegistrations({}).total, 13);
    assert.equal(getEventOverview().confirmedCount, 150);
  });

  it("is idempotent and does not update unknown registrations", () => {
    updateRegistrationStatus("Julian Estrada", "confirmed");
    const second = updateRegistrationStatus("Julian Estrada", "confirmed");
    assert.equal(second?.previousStatus, "confirmed");
    assert.equal(updateRegistrationStatus("Nobody Here", "confirmed"), undefined);
  });
});
