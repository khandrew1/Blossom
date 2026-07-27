import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEMO_MESSAGES,
  isSlackAgent,
  loadSlackControllerConfig,
  postDemoMessage,
  resetDemoMessages,
  SLACK_CONTROLLER_HTML,
} from "../src/slack-controller.js";

describe("Slack demo controller", () => {
  it("loads required server-side configuration without exposing it in the page", () => {
    const config = loadSlackControllerConfig({
      SLACK_CONTROLLER_KEY: "private-controller-key",
      SLACK_DEMO_CHANNEL_ID: "C123",
      SLACK_JENNY_BOT_TOKEN: "xoxb-jenny",
      SLACK_RYAN_BOT_TOKEN: "xoxb-ryan",
    });

    assert.equal(config.channelId, "C123");
    assert.equal(config.tokens.jenny, "xoxb-jenny");
    assert.doesNotMatch(SLACK_CONTROLLER_HTML, /xoxb-/);
  });

  it("recognizes only the two planted agent identities", () => {
    assert.equal(isSlackAgent("jenny"), true);
    assert.equal(isSlackAgent("ryan"), true);
    assert.equal(isSlackAgent("other"), false);
  });

  it("posts a fixed server-side message with the matching bot token", async () => {
    let request: { url: string; init: RequestInit | undefined } | undefined;
    const fakeFetch: typeof fetch = async (url, init) => {
      request = { url: String(url), init };
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    };

    await postDemoMessage(
      "jenny",
      {
        controllerKey: "key",
        channelId: "C123",
        tokens: { jenny: "xoxb-jenny", ryan: "xoxb-ryan" },
      },
      fakeFetch
    );

    assert.equal(request?.url, "https://slack.com/api/chat.postMessage");
    assert.equal(
      new Headers(request?.init?.headers).get("authorization"),
      "Bearer xoxb-jenny"
    );
    assert.deepEqual(JSON.parse(String(request?.init?.body)), {
      channel: "C123",
      text: DEMO_MESSAGES.jenny,
    });
  });

  it("paginates shared history and lets each bot delete only its own messages", async () => {
    const calls: Array<{ method: string; token: string; body: Record<string, unknown> }> = [];
    const fakeFetch: typeof fetch = async (url, init) => {
      const method = String(url).split("/").at(-1)!;
      const token = new Headers(init?.headers).get("authorization")!.replace("Bearer ", "");
      const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      calls.push({ method, token, body });

      let result: Record<string, unknown>;
      if (method === "auth.test") {
        result = { ok: true, user_id: token === "xoxb-jenny" ? "UJENNY" : "URYAN" };
      } else if (method === "conversations.history") {
        const cursor = body.cursor;
        result = cursor
          ? {
              ok: true,
              messages: [{ ts: "3", user: "SOMEONE_ELSE" }],
              response_metadata: { next_cursor: "" },
            }
          : {
              ok: true,
              messages: [
                { ts: "1", user: "UJENNY" },
                { ts: "2", user: "URYAN" },
              ],
              response_metadata: { next_cursor: "page-2" },
            };
      } else if (method === "chat.delete") {
        result = { ok: true };
      } else {
        throw new Error(`Unexpected Slack method: ${method}`);
      }

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    };

    const deleted = await resetDemoMessages(
      {
        controllerKey: "key",
        channelId: "C123",
        tokens: { jenny: "xoxb-jenny", ryan: "xoxb-ryan" },
      },
      fakeFetch
    );

    assert.equal(deleted, 2);
    assert.deepEqual(
      calls.filter(({ method }) => method === "chat.delete").map(({ token, body }) => ({
        token,
        ts: body.ts,
      })),
      [
        { token: "xoxb-jenny", ts: "1" },
        { token: "xoxb-ryan", ts: "2" },
      ]
    );
    assert.equal(
      calls.filter(({ method }) => method === "conversations.history").length,
      2
    );
  });

  it("falls back to the other bot when the first cannot read channel history", async () => {
    const calls: Array<{ method: string; token: string; body: Record<string, unknown> }> = [];
    const fakeFetch: typeof fetch = async (url, init) => {
      const method = String(url).split("/").at(-1)!;
      const token = new Headers(init?.headers).get("authorization")!.replace("Bearer ", "");
      const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      calls.push({ method, token, body });

      let result: Record<string, unknown>;
      if (method === "auth.test") {
        result = { ok: true, user_id: token === "xoxb-jenny" ? "UJENNY" : "URYAN" };
      } else if (method === "conversations.history" && token === "xoxb-jenny") {
        result = { ok: false, error: "missing_scope" };
      } else if (method === "conversations.history") {
        result = {
          ok: true,
          messages: [
            { ts: "1", user: "UJENNY" },
            { ts: "2", user: "URYAN" },
          ],
          response_metadata: { next_cursor: "" },
        };
      } else if (method === "chat.delete") {
        result = { ok: true };
      } else {
        throw new Error(`Unexpected Slack method: ${method}`);
      }

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    };

    const deleted = await resetDemoMessages(
      {
        controllerKey: "key",
        channelId: "C123",
        tokens: { jenny: "xoxb-jenny", ryan: "xoxb-ryan" },
      },
      fakeFetch
    );

    assert.equal(deleted, 2);
    assert.deepEqual(
      calls.filter(({ method }) => method === "conversations.history").map(({ token }) => token),
      ["xoxb-jenny", "xoxb-ryan"]
    );
  });
});
