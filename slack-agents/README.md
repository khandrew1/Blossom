# Blossom Slack Demo Controller

A deliberately tiny, local-only controller for a staged Blossom Hill Cafe demo. It presents two large phone buttons:

- **Jenny** posts a predefined waitlist check about Richard.
- **Ryan** posts a predefined drink/allergy-check reply.

The message text lives on the server, not in the browser. Each identity uses its own Slack bot token, so the messages appear from two clearly separate bot identities. There is no inbound watcher and nothing is publicly deployed.

## Prerequisites

- Node.js 20 or newer
- A Tailnet shared by the presenter phone and this computer
- Two Slack apps/bot users, visibly named **Jenny** and **Ryan**
- A private Slack channel for the demo

## Slack setup

1. Create or select one Slack app for Jenny and another for Ryan.
2. For each app, add the bot token scope `chat:write`, then install/reinstall it to the demo workspace.
3. Invite both bots to the private demo channel. Private channels require explicit membership.
4. Copy `.env.example` to `.env`.
5. Put each bot's `xoxb-...` token in its matching variable.
6. Put the private channel's ID (such as `C0123456789`, not its display name) in `SLACK_DEMO_CHANNEL_ID`.

Never commit `.env`; it is ignored by Git. Tokens remain server-side and are never sent to the phone.

## Install and verify

```sh
cd slack-agents
npm install
npm run check
```

## Run locally

For computer-only testing, leave `HOST=127.0.0.1`:

```sh
npm run dev
```

Open `http://127.0.0.1:8787`.

For the live phone demo, find this computer's Tailscale IPv4 address:

```sh
tailscale ip -4
```

Set that exact address as `HOST` in `.env`, restart `npm run dev`, and open `http://<tailscale-ip>:8787` on the phone. Binding to the Tailscale address keeps the controller off other network interfaces. Both devices must be on the same Tailnet and permitted by its ACLs.

Before presenting, tap each button once and confirm that the correct bot posts to the correct private channel. A button visibly confirms success or failure and stays disabled for 2.5 seconds; the server independently rejects duplicate sends within 2 seconds.

## Production-style local run

```sh
npm run build
npm start
```

This is still a local server. Do not expose the port through a public tunnel or deploy it publicly.
