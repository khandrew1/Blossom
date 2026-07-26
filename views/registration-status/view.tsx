import { ThemeProvider, useToolContext, useViewTheme } from "mcp-use/react";

function RegistrationStatus() {
  const tool = useToolContext<"update_registration_status">();
  const dark = useViewTheme() === "dark";
  const panel = dark ? "#1D211D" : "#FAFDF9";
  const ink = dark ? "#F2F8F1" : "#203120";
  const subtle = dark ? "#9FB09E" : "#60705F";
  const border = dark ? "#344134" : "#DDE8DB";

  if (tool.status === "pending") return <div style={{ ...base, background: panel, color: ink }}>Updating the registration…</div>;
  if (tool.status === "error") return <div style={{ ...base, background: panel, color: ink }} role="alert">{tool.error.message}</div>;

  const result = tool.toolOutput;
  return (
    <article style={{ ...base, background: panel, color: ink, borderColor: border }}>
      <div style={{ width: 48, height: 48, borderRadius: "50%", background: result.changed ? "#DDF2DE" : "#EEEAE2", color: result.changed ? "#28713A" : "#685E51", display: "grid", placeItems: "center", fontSize: 23 }}>
        {result.changed ? "✓" : "—"}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ margin: "0 0 5px", color: subtle, fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }}>
          {result.changed ? "Registration updated" : "Already up to date"}
        </p>
        <h1 style={{ margin: 0, fontFamily: "Georgia,serif", fontWeight: 500, fontSize: 25 }}>{result.registration.name}</h1>
        <div style={{ marginTop: 13, display: "flex", alignItems: "center", gap: 9, fontSize: 14 }}>
          <span style={{ color: subtle, textTransform: "capitalize" }}>{result.previousStatus}</span>
          <span aria-hidden style={{ color: subtle }}>→</span>
          <strong style={{ padding: "6px 10px", borderRadius: 999, background: "#DDF2DE", color: "#28713A", textTransform: "capitalize" }}>{result.registration.status}</strong>
        </div>
      </div>
    </article>
  );
}

const base = {
  boxSizing: "border-box",
  maxWidth: 600,
  margin: "0 auto",
  padding: 22,
  border: "1px solid",
  borderRadius: 22,
  display: "flex",
  alignItems: "center",
  gap: 17,
  boxShadow: "0 12px 35px rgba(40,65,35,.08)",
  fontFamily: "Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
} as const;

export default function RegistrationStatusView() {
  return <ThemeProvider><RegistrationStatus /></ThemeProvider>;
}
