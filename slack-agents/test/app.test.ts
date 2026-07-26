import assert from "node:assert/strict";
import { test } from "node:test";
import type { AddressInfo } from "node:net";
import { createApp } from "../src/app.js";
import type { AgentName } from "../src/messages.js";

async function withServer(
  post: (agent: AgentName) => Promise<void>,
  run: (baseUrl: string) => Promise<void>
): Promise<void> {
  const server = createApp({ post }).listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const { port } = server.address() as AddressInfo;
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
  }
}

test("routes Jenny and Ryan to the correct identity", async () => {
  const calls: AgentName[] = [];
  await withServer(async (agent) => { calls.push(agent); }, async (baseUrl) => {
    for (const agent of ["jenny", "ryan"] as const) {
      const response = await fetch(`${baseUrl}/api/send/${agent}`, { method: "POST" });
      assert.equal(response.status, 200);
    }
  });
  assert.deepEqual(calls, ["jenny", "ryan"]);
});

test("rejects unknown identities", async () => {
  await withServer(async () => {}, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/send/someone-else`, { method: "POST" });
    assert.equal(response.status, 404);
  });
});

test("debounces repeat sends for one identity", async () => {
  let calls = 0;
  await withServer(async () => { calls += 1; }, async (baseUrl) => {
    const first = await fetch(`${baseUrl}/api/send/jenny`, { method: "POST" });
    const second = await fetch(`${baseUrl}/api/send/jenny`, { method: "POST" });
    assert.equal(first.status, 200);
    assert.equal(second.status, 429);
  });
  assert.equal(calls, 1);
});
