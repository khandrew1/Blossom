import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import {
  getRoles,
  resetRoles,
  updateRoles,
} from "../src/roles.js";

beforeEach(resetRoles);
afterEach(resetRoles);

describe("event roles", () => {
  it("returns the deterministic Blossom Hill team assignments", () => {
    assert.deepEqual(getRoles(), [
      { name: "Andrew Khadder", role: "Welcome guests at the door" },
      { name: "Ryan Hoang", role: "Serve drinks" },
      { name: "Maya Chen", role: "Manage pastries" },
      { name: "Jenny Park", role: "Photograph the event" },
    ]);
  });

  it("supports focused reads without changing canonical order", () => {
    assert.deepEqual(getRoles(["Jenny Park", "Maya Chen"]), [
      { name: "Maya Chen", role: "Manage pastries" },
      { name: "Jenny Park", role: "Photograph the event" },
    ]);
  });

  it("switches Maya and Jenny atomically and idempotently", () => {
    const switched = updateRoles([
      { name: "Maya Chen", role: "Photograph the event" },
      { name: "Jenny Park", role: "Manage pastries" },
    ]);
    assert.equal(switched.changed, true);
    assert.deepEqual(getRoles(["Maya Chen", "Jenny Park"]), [
      { name: "Maya Chen", role: "Photograph the event" },
      { name: "Jenny Park", role: "Manage pastries" },
    ]);

    const repeated = updateRoles([
      { name: "Maya Chen", role: "Photograph the event" },
      { name: "Jenny Park", role: "Manage pastries" },
    ]);
    assert.equal(repeated.changed, false);
  });
});
