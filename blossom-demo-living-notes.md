# Blossom MCP v2 Launch Demo — Living Notes

_Status: concept framing established; no software built._

## One-line concept

Use a deliberately minimal, fictional event-registration MCP called **Blossom** to plan supplies for **Blossom Hill Cafe**, a launch-party event roughly one month away. Turn privacy-safe registration insights into a Slack allergy follow-up, simulate a Custom Ink shirt order in a separate Codex thread, then convert that thread’s result into an expense report saved in Notion.

## Chosen story

- Primary framing: **future-event planning**.
- Event: **Blossom Hill Cafe**.
- Occasion: MCP v2 launch party.
- Experience goal: fast, believable, polished, and clearly deterministic.

## Main demo arc

1. Query registrations and aggregate T-shirt sizes.
2. Report the quantity needed for each size.
3. Use Blossom’s allergy insight for the privacy-safe Slack follow-up to Ryan.
4. Have a separate Codex thread handle the Custom Ink T-shirt purchase flow with clearly simulated/mock order data.
5. After the shirt-order thread finishes, have the main assistant read its result.
6. Generate an expense report from the structured mock order.
7. Save the expense report in Notion.

## Integration shape

- Active connected services: **Blossom**, **Slack**, and **Notion**.
- T-shirt purchasing: a separate **Codex thread** handles **Custom Ink through the browser** using clearly simulated/mock order data.
- Do not claim or imply that a Custom Ink MCP is available.
- The main assistant reads the completed shirt-order thread, generates the expense report, and saves it in Notion.

## Latest rehearsal phrasing

“Okay, cool. Once the shirts are ordered, and we'll just say Codex ordered the shirts. I'll put some custom instructions somewhere that will make it known that it's fake data, so that it could flow really well. But basically, I guess what we could do is that after it's done, I can ask you to look into that thread, generate an expense report, and then save it in Notion.”

## Mock order result contract

The shirt-order thread should return:

- Items
- Size quantities
- Subtotal
- Shipping
- Tax
- Total
- Order status

## Allergy safety beat

1. Aggregate the allergies represented among attendees.
2. Do not expose attendee names.
3. Draft/send a Slack message to **Ryan** asking whether planned drinks contain any of those allergens.
4. If they do, ask Ryan to identify substitutions quickly.

Ryan must be fictional or explicitly pre-consenting before any real Slack send.

### Preferred one-shot rehearsal line

“Hey Codex, Blossom Hill Cafe is in a month. Use Blossom to summarize the allergies for confirmed attendees, then Slack Ryan to check whether any planned drinks conflict and flag anything we need to change right away.”

## Minimal Blossom data model

- Event details
- Registrations
- RSVP status
- Guest count
- T-shirt size
- Drink preference
- Dietary constraints
  - Milk preferences/restrictions
  - Alcohol preferences/restrictions
- Allergies

## Data and privacy rules

- Use fake, deterministic, clearly mock data.
- Make the simulated nature of the Custom Ink order explicit in the custom instructions and result.
- Prefer aggregates in outputs.
- Never include attendee names when raising allergy concerns.
- Use only fictional or pre-consenting Slack recipients.
- Require the user to supply/authorize the actual recipient before sending.
- Avoid dependence on live web data.

## Demo design guardrails

- Keep Blossom minimal; avoid adding unrelated event-management features.
- Keep the mock Custom Ink order deterministic and fast.
- Label the order result clearly enough that it cannot be mistaken for a real purchase.
- Separate drafting from sending so authorization is visible.
- Keep the Custom Ink browser/thread step distinct from MCP integrations.
- Make the thread handoff legible: structured order result in the purchase thread, expense-report generation and Notion save in the main assistant.

## Open decisions

- Exact event date and expected attendance.
- Seed registration mix and resulting T-shirt quantities.
- Seed drink/dietary/allergy distribution.
- Exact Custom Ink shirt choice and seeded mock prices.
- Custom instructions that clearly mark the purchase data and order status as simulated.
- Whether Ryan is fictional or a pre-consenting real recipient.
- Expense-report format and destination page/database in Notion.

## Current recommended run-of-show

1. Introduce the upcoming Blossom Hill Cafe event.
2. Ask Blossom for the relevant registration insights, including aggregate T-shirt quantities.
3. Run the preferred one-shot Blossom-to-Slack allergy follow-up.
4. Show the separate Codex thread handling the simulated Custom Ink order.
5. Let that thread return items, size quantities, subtotal, shipping, tax, total, and order status.
6. Ask the main assistant to inspect the completed thread and generate an expense report.
7. Save the expense report in Notion.

## Rehearsal feedback

- The user plans to rehearse the demo live.
- Evaluate the content flow: story clarity, sequencing, transitions, pacing, and whether each action earns its place.
- Ignore stammering and other delivery disfluency when giving feedback.

## Notes discipline for future updates

- Keep this file as the current source of truth, not an append-only transcript.
- Record decisions by replacing resolved open questions.
- Retain only the active future-event plan and current design decisions.
- Remove alternatives and decisions that are no longer being pursued.
- Update only from material the coordinator explicitly forwards for this purpose.
- Do not build software unless explicitly requested.
