export const DEMO_MESSAGES = {
  jenny:
    "Hi team — quick waitlist check: Richard is still waitlisted. Do we have an updated estimate for him?",
  ryan:
    "I checked the drink details for Richard: please confirm his allergy before serving, and use the allergy-safe preparation if he orders it."
} as const;

export type AgentName = keyof typeof DEMO_MESSAGES;
