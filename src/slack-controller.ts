export const SLACK_AGENTS = ["jenny", "ryan"] as const;
export type SlackAgent = (typeof SLACK_AGENTS)[number];

export const DEMO_MESSAGES: Record<SlackAgent, string> = {
  jenny:
    "Hey Andrew — my boyfriend Julian Estrada is still on the waitlist. Could you check his registration and see whether there’s room to accept him?",
  ryan:
    "I checked the planned drinks against the allergy list. Everything looks good with the allergy-safe preparation, so we don’t need to change the menu.",
};

interface SlackControllerConfig {
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
      main { display: grid; grid-template-rows: 1fr 1fr; gap: 10px; height: calc(100dvh - 52px); padding: max(10px, env(safe-area-inset-top)) 10px 10px; }
      button { width: 100%; border: 5px solid #fff; border-radius: 22px; color: #fff; touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
      button strong, button span { display: block; }
      button strong { font-size: clamp(3.5rem, 18vw, 7rem); line-height: .95; }
      button span { margin-top: 12px; font-size: clamp(1rem, 5vw, 2rem); font-weight: 900; }
      .jenny { background: #0759c7; }
      .ryan { background: #a52a00; }
      button:active:not(:disabled) { transform: scale(.985); }
      button:disabled { filter: grayscale(.8); opacity: .5; }
      #status { height: 52px; padding: 11px 12px max(8px, env(safe-area-inset-bottom)); color: #fff; font-size: 1.15rem; font-weight: 900; text-align: center; background: #101010; }
      #status.success { background: #06752b; }
      #status.error { background: #b00020; }
    </style>
  </head>
  <body>
    <main>
      <button class="jenny" data-agent="jenny" type="button"><strong>JENNY</strong><span>POST WAITLIST CHECK</span></button>
      <button class="ryan" data-agent="ryan" type="button"><strong>RYAN</strong><span>POST ALLERGY REPLY</span></button>
    </main>
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
    </script>
  </body>
</html>`;
