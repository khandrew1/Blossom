export interface AppConfig {
  jennyToken: string;
  ryanToken: string;
  channelId: string;
  host: string;
  port: number;
}

function required(name: string, env: NodeJS.ProcessEnv): string {
  const value = env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const port = Number(env.PORT ?? "8787");
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer from 1 to 65535");
  }

  return {
    jennyToken: required("SLACK_JENNY_BOT_TOKEN", env),
    ryanToken: required("SLACK_RYAN_BOT_TOKEN", env),
    channelId: required("SLACK_DEMO_CHANNEL_ID", env),
    host: env.HOST?.trim() || "127.0.0.1",
    port
  };
}
