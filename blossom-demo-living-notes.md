# Blossom MCP v2 Launch Demo — Living Notes

_Status: role tools and streamed generated UI implemented; full demo remains deterministic._

## One-line concept

Use a deliberately minimal, fictional event-registration MCP called **Blossom** to coordinate **Blossom Hill Cafe**, a launch-party event roughly one month away. Open with a real-time generated staff-role UI and a live role switch, then turn privacy-safe registration insights into a Slack allergy follow-up, handle Jenny’s request to admit her waitlisted boyfriend Julian, simulate a Custom Ink shirt order in a separate Codex thread, and save its expense report in Notion.

## Chosen story

- Primary framing: **future-event planning**.
- Event: **Blossom Hill Cafe**.
- Occasion: MCP v2 launch party.
- Experience goal: fast, believable, polished, and clearly deterministic.

## Main demo arc

1. Get everyone’s event roles and stream them into a generated UI.
2. Switch Jenny Park and Maya Chen atomically, then render the updated UI.
3. Query registrations and aggregate T-shirt sizes.
4. Report the quantity needed for each size.
5. Use Blossom’s allergy insight for the privacy-safe Slack follow-up to Ryan.
6. Tell a separate Codex thread to “order +10 of every size” through the simulated Custom Ink purchase flow.
7. While the shirt-order thread is running, receive Jenny’s staged Slack message about Julian Estrada.
8. Pull up Julian’s waitlisted registration, accept him, and reply to Jenny that he is in.
9. Receive Ryan’s reply in the same Slack channel confirming that the planned drinks are fine.
10. Return to the completed shirt-order thread and read its result.
11. Generate an expense report from the structured mock order.
12. Save the expense report in Notion.

## Integration shape

- Active connected services: **Blossom**, **Slack**, and **Notion**.
- T-shirt purchasing: a separate **Codex thread** handles **Custom Ink through the browser** using clearly simulated/mock order data.
- Do not claim or imply that a Custom Ink MCP is available.
- The main assistant reads the completed shirt-order thread, generates the expense report, and saves it in Notion.

## Latest rehearsal phrasing

“Okay, cool. Once the shirts are ordered, and we'll just say Codex ordered the shirts. I'll put some custom instructions somewhere that will make it known that it's fake data, so that it could flow really well. But basically, I guess what we could do is that after it's done, I can ask you to look into that thread, generate an expense report, and then save it in Notion.”

## Mock order result contract

### Presenter instruction

After Blossom reports the registration totals by size, say:

“Order +10 of every size.”

Interpret this as the registration total for each represented size plus ten extra shirts in that same size. The seeded confirmed registrations produce this order:

- XS: 1 registered + 10 extra = 11
- S: 2 registered + 10 extra = 12
- M: 3 registered + 10 extra = 13
- L: 3 registered + 10 extra = 13
- XL: 2 registered + 10 extra = 12
- 2XL: 1 registered + 10 extra = 11

Julian wears an L. Because the order includes ten extra L shirts, admitting him during the Custom Ink task does not require changing the order.

The shirt-order thread should return:

- Items
- Size quantities, including the ten-shirt buffer for each size
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

## Live Slack interruption

Place Jenny’s staged message after the separate Custom Ink thread starts and while it is still working. This uses the order’s natural wait time, creates a believable live interruption, and lets the demo show an individual registration lookup and write without slowing the opening.

### Staged messages

- Jenny: “Hey Andrew — my boyfriend Julian Estrada is still on the waitlist. Could you check his registration and see whether there’s room to accept him?”
- Ryan: “I checked the planned drinks against the allergy list. Everything looks good with the allergy-safe preparation, so we don’t need to change the menu.”

Ryan’s reply resolves the earlier allergy follow-up. It should appear near Jenny’s message in the same channel, but remain a separate conversation beat.

### Presenter instruction

After Jenny’s message appears, say:

“Okay, pull up his registration. Accept it, then send a message back to Jenny saying he’s in.”

The assistant should:

1. Look up **Julian Estrada** and show that he is waitlisted.
2. Change his status to **confirmed**.
3. Send Jenny a concise Slack reply confirming that Julian is in.
4. Briefly acknowledge Ryan’s all-clear when it appears.
5. Return to the Custom Ink thread once the interruption is resolved.

Suggested reply to Jenny:

“He’s in — I found Julian Estrada’s registration and moved him from the waitlist to confirmed.”

Keep the registration lookup visible before the status change. That makes the user’s authorization and the state transition easy to follow.

## Minimal Blossom data model

- Event details
- Staff roles
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
- Interpret “+10 of every size” as ten shirts added to each size represented in the confirmed-registration aggregate.
- Label the order result clearly enough that it cannot be mistaken for a real purchase.
- Separate drafting from sending so authorization is visible.
- Keep the Custom Ink browser/thread step distinct from MCP integrations.
- Make the thread handoff legible: structured order result in the purchase thread, expense-report generation and Notion save in the main assistant.
- Treat Jenny’s message as an interruption during the Custom Ink wait, then return explicitly to the order thread.
- Keep Jenny’s admission request and Ryan’s allergy response as two separate Slack beats, even if the messages arrive close together.

## Open decisions

- Exact event date and expected attendance.
- Seed drink/dietary/allergy distribution.
- Exact Custom Ink shirt choice and seeded mock prices.
- Custom instructions that clearly mark the purchase data and order status as simulated.
- Whether Ryan is fictional or a pre-consenting real recipient.
- Expense-report format and destination page/database in Notion.

## Current recommended run-of-show

1. Say: “Get everyone’s roles for the event and generate a UI for me to look at.”
2. Let the role UI visibly assemble as JSON components stream into `generate_ui`.
3. Say: “Switch Jenny and Maya,” then show the updated generated UI.
4. Ask Blossom for the relevant registration insights, including aggregate T-shirt quantities.
5. Run the preferred one-shot Blossom-to-Slack allergy follow-up.
6. Say “Order +10 of every size,” then show the separate Codex thread handling the simulated Custom Ink order.
7. While the order thread is working, trigger Jenny’s staged message about Julian.
8. Say: “Okay, pull up his registration. Accept it, then send a message back to Jenny saying he’s in.”
9. Show Julian’s waitlisted registration, confirm him, and send Jenny the confirmation.
10. Let Ryan’s all-clear appear in the same channel and acknowledge it briefly.
11. Return to the order thread and let it report items, size quantities, subtotal, shipping, tax, total, and order status.
12. Ask the main assistant to inspect the completed thread and generate an expense report.
13. Save the expense report in Notion.

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
