import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEMO_MESSAGES,
  isSlackAgent,
  loadSlackControllerConfig,
  postDemoMessage,
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
});
