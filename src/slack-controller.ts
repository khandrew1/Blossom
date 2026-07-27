export const SLACK_AGENTS = ["jenny", "ryan"] as const;
export type SlackAgent = (typeof SLACK_AGENTS)[number];

export const DEMO_MESSAGES: Record<SlackAgent, string> = {
  jenny:
    "Hey Andrew — my boyfriend Julian Estrada is still on the waitlist. Could you check his registration and see whether there’s room to accept him?",
  ryan:
    "I checked the planned drinks against the allergy list. Everything looks good with the allergy-safe preparation, so we don’t need to change the menu.",
};

export interface SlackControllerConfig {
  controllerKey: string;
  channelId: string;
  tokens: Record<SlackAgent, string>;
}

function required(name: string, env: NodeJS.ProcessEnv): string {
  const value = env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function loadSlackControllerConfig(
  env: NodeJS.ProcessEnv = process.env
): SlackControllerConfig {
  return {
    controllerKey: required("SLACK_CONTROLLER_KEY", env),
    channelId: required("SLACK_DEMO_CHANNEL_ID", env),
    tokens: {
      jenny: required("SLACK_JENNY_BOT_TOKEN", env),
      ryan: required("SLACK_RYAN_BOT_TOKEN", env),
    },
  };
}

export function isSlackAgent(value: string): value is SlackAgent {
  return SLACK_AGENTS.some((agent) => agent === value);
}

export async function postDemoMessage(
  agent: SlackAgent,
  config: SlackControllerConfig,
  request: typeof fetch = fetch
): Promise<void> {
  const response = await request("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      authorization: `Bearer ${config.tokens[agent]}`,
      "content-type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      channel: config.channelId,
      text: DEMO_MESSAGES[agent],
    }),
  });

  const result = (await response.json()) as { ok?: boolean; error?: string };
  if (!response.ok || result.ok !== true) {
    throw new Error(result.error ?? `Slack returned HTTP ${response.status}`);
  }
}

interface SlackMessage {
  ts?: string;
  user?: string;
}

interface SlackApiResult {
  ok?: boolean;
  error?: string;
  user_id?: string;
  messages?: SlackMessage[];
  response_metadata?: { next_cursor?: string };
}

async function slackApi(
  method: string,
  token: string,
  payload: Record<string, unknown>,
  request: typeof fetch
): Promise<SlackApiResult> {
  const response = await request(`https://slack.com/api/${method}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(payload),
  });
  const result = (await response.json()) as SlackApiResult;
  if (!response.ok || result.ok !== true) {
    throw new Error(result.error ?? `Slack returned HTTP ${response.status}`);
  }
  return result;
}

async function listChannelMessages(
  token: string,
  channelId: string,
  request: typeof fetch
): Promise<SlackMessage[]> {
  const messages: SlackMessage[] = [];
  let cursor = "";

  for (let page = 0; page < 20; page += 1) {
    const result = await slackApi(
      "conversations.history",
      token,
      { channel: channelId, limit: 100, ...(cursor ? { cursor } : {}) },
      request
    );
    messages.push(...(result.messages ?? []));
    cursor = result.response_metadata?.next_cursor?.trim() ?? "";
    if (!cursor) break;
  }

  return [...new Map(
    messages.filter((message) => message.ts).map((message) => [message.ts!, message])
  ).values()];
}

export async function resetDemoMessages(
  config: SlackControllerConfig,
  request: typeof fetch = fetch
): Promise<number> {
  let deleted = 0;

  for (const agent of SLACK_AGENTS) {
    const token = config.tokens[agent];
    const identity = await slackApi("auth.test", token, {}, request);
    if (!identity.user_id) {
      throw new Error(`Slack did not return the ${agent} bot user ID`);
    }

    const messages = await listChannelMessages(token, config.channelId, request);
    const owned = messages.filter(
      (message) => message.user === identity.user_id && message.ts
    );

    for (const message of owned) {
      await slackApi(
        "chat.delete",
        token,
        { channel: config.channelId, ts: message.ts },
        request
      );
      deleted += 1;
    }
  }

  return deleted;
}

export const SLACK_CONTROLLER_HTML = String.raw`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no" />
    <meta name="theme-color" content="#101010" />
    <title>Blossom Demo Controller</title>
    <style>
      :root { color-scheme: dark; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      * { box-sizing: border-box; }
      html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; background: #101010; }
      main { display: grid; grid-template-rows: 1fr 1fr; gap: 10px; height: calc(100dvh - 124px); padding: max(10px, env(safe-area-inset-top)) 10px 10px; }
      button { width: 100%; color: #fff; touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
      .agent { border: 5px solid #fff; border-radius: 22px; }
      .agent strong, .agent span { display: block; }
      .agent strong { font-size: clamp(3.5rem, 18vw, 7rem); line-height: .95; }
      .agent span { margin-top: 12px; font-size: clamp(1rem, 5vw, 2rem); font-weight: 900; }
      .jenny { background: #0759c7; }
      .ryan { background: #a52a00; }
      button:active:not(:disabled) { transform: scale(.985); }
      button:disabled { filter: grayscale(.8); opacity: .5; }
      #reset { height: 62px; border: 2px solid #777; border-radius: 14px; background: #282828; font-size: 1rem; font-weight: 900; letter-spacing: .08em; }
      footer { height: 72px; padding: 0 10px 10px; }
      #status { height: 52px; padding: 11px 12px max(8px, env(safe-area-inset-bottom)); color: #fff; font-size: 1.15rem; font-weight: 900; text-align: center; background: #101010; }
      #status.success { background: #06752b; }
      #status.error { background: #b00020; }
    </style>
  </head>
  <body>
    <main>
      <button class="agent jenny" data-agent="jenny" type="button"><strong>JENNY</strong><span>POST WAITLIST CHECK</span></button>
      <button class="agent ryan" data-agent="ryan" type="button"><strong>RYAN</strong><span>POST ALLERGY REPLY</span></button>
    </main>
    <footer><button id="reset" type="button">RESET DEMO</button></footer>
    <div id="status" role="status" aria-live="polite">READY</div>
    <script>
      const status = document.querySelector("#status");
      const key = new URLSearchParams(location.search).get("key") || "";
      for (const button of document.querySelectorAll("[data-agent]")) {
        button.addEventListener("click", async () => {
          if (button.disabled) return;
          const agent = button.dataset.agent;
          button.disabled = true;
          status.className = "";
          status.textContent = "SENDING " + agent.toUpperCase() + "…";
          try {
            const response = await fetch("/demo/slack/send/" + agent, {
              method: "POST",
              headers: { "x-blossom-controller-key": key }
            });
            const result = await response.json();
            if (!response.ok || !result.ok) throw new Error(result.error || "Send failed");
            status.className = "success";
            status.textContent = agent.toUpperCase() + " SENT ✓";
          } catch (error) {
            status.className = "error";
            status.textContent = "NOT SENT — " + error.message;
          } finally {
            window.setTimeout(() => {
              button.disabled = false;
              status.className = "";
              status.textContent = "READY";
            }, 2500);
          }
        });
      }
      document.querySelector("#reset").addEventListener("click", async (event) => {
        const button = event.currentTarget;
        if (button.disabled) return;
        button.disabled = true;
        status.className = "";
        status.textContent = "RESETTING DEMO…";
        try {
          const response = await fetch("/demo/slack/reset", {
            method: "POST",
            headers: { "x-blossom-controller-key": key }
          });
          const result = await response.json();
          if (!response.ok || !result.ok) throw new Error(result.error || "Reset failed");
          status.className = "success";
          status.textContent = "RESET — " + result.deleted + " MESSAGE" + (result.deleted === 1 ? "" : "S") + " DELETED ✓";
        } catch (error) {
          status.className = "error";
          status.textContent = "RESET FAILED — " + error.message;
        } finally {
          window.setTimeout(() => {
            button.disabled = false;
            status.className = "";
            status.textContent = "READY";
          }, 2500);
        }
      });
    </script>
  </body>
</html>`;
