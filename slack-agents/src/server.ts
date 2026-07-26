import "dotenv/config";
import { WebClient } from "@slack/web-api";
import { createApp, type MessagePoster } from "./app.js";
import { loadConfig } from "./config.js";
import { DEMO_MESSAGES, type AgentName } from "./messages.js";

const config = loadConfig();
const clients: Record<AgentName, WebClient> = {
  jenny: new WebClient(config.jennyToken),
  ryan: new WebClient(config.ryanToken)
};

const poster: MessagePoster = {
  async post(agent) {
    await clients[agent].chat.postMessage({
      channel: config.channelId,
      text: DEMO_MESSAGES[agent]
    });
  }
};

createApp(poster).listen(config.port, config.host, () => {
  console.log(`Blossom Slack controller listening on http://${config.host}:${config.port}`);
});
