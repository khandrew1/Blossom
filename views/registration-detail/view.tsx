import {
  Image,
  ThemeProvider,
  useToolContext,
  useViewTheme,
} from "mcp-use/react";

const ACCENT = "#F2B56B";

function RegistrationDetail() {
  const tool = useToolContext<"get_registration">();
  const dark = useViewTheme() === "dark";

  if (tool.status === "pending") {
    return <div style={placeholder(dark)}>Finding the registration…</div>;
  }
  if (tool.status === "error") {
    return (
      <div style={placeholder(dark)} role="alert">
        {tool.error.message}
      </div>
    );
  }

  const registration = tool.toolOutput;
  const portraitSrc =
    registration.name === "Maya Chen"
      ? "/maya-chen-cafe.png"
      : registration.name === "Julian Estrada"
        ? "/julian-estrada-cafe.png"
        : null;

  return (
    <article style={shell(dark)}>
      <Image
        src="/blossom-cafe-background.png"
        alt=""
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
          filter: "saturate(.92) contrast(1.04)",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: [
            "linear-gradient(90deg, rgba(16,12,9,.86) 0%, rgba(16,12,9,.62) 46%, rgba(16,12,9,.22) 100%)",
            "linear-gradient(0deg, rgba(10,8,6,.92) 0%, rgba(10,8,6,.62) 32%, rgba(10,8,6,.16) 62%, rgba(10,8,6,0) 88%)",
          ].join(","),
        }}
      />

      <div style={content}>
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <StatusPill status={registration.status} />
        </header>

        <div>
          <p
            style={{
              margin: "0 0 10px",
              color: ACCENT,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: ".15em",
              textTransform: "uppercase",
              textShadow: "0 1px 8px rgba(0,0,0,.55)",
            }}
          >
            Blossom Hill Cafe · Reservation
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "clamp(14px, 3vw, 20px)",
            }}
          >
            {portraitSrc ? (
              <Image
                src={portraitSrc}
                alt={registration.name}
                style={{
                  width: "clamp(64px, 13vw, 82px)",
                  height: "clamp(64px, 13vw, 82px)",
                  flex: "0 0 auto",
                  objectFit: "cover",
                  objectPosition: "center 35%",
                  borderRadius: 18,
                  border: "1px solid rgba(255,249,239,.28)",
                  boxShadow:
                    "0 1px 0 rgba(255,255,255,.12) inset, 0 10px 28px rgba(0,0,0,.32)",
                }}
              />
            ) : (
              <span
                aria-hidden
                style={{
                  display: "grid",
                  width: "clamp(64px, 13vw, 82px)",
                  height: "clamp(64px, 13vw, 82px)",
                  flex: "0 0 auto",
                  placeItems: "center",
                  borderRadius: 18,
                  border: "1px solid rgba(255,249,239,.24)",
                  background: "rgba(18,13,9,.46)",
                  color: ACCENT,
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: 27,
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                }}
              >
                {registration.name
                  .split(/\s+/)
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)}
              </span>
            )}

            <h1
              style={{
                margin: "0 0 0 -.035em",
                maxWidth: 540,
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: "clamp(38px, 7vw, 58px)",
                lineHeight: 1,
                fontWeight: 500,
                letterSpacing: "-.04em",
                textShadow: "0 3px 22px rgba(0,0,0,.5)",
              }}
            >
              {registration.name}
            </h1>
          </div>

          <p
            style={{
              margin: "16px 0 0",
              fontSize: 14,
              lineHeight: 1.4,
              opacity: .88,
              textShadow: "0 1px 10px rgba(0,0,0,.55)",
            }}
          >
            <span style={{ color: ACCENT, fontWeight: 650 }}>Contact</span>
            <span aria-hidden style={{ margin: "0 8px", opacity: .45 }}>
              ·
            </span>
            {registration.email}
          </p>

          <dl
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "14px 34px",
              margin: "19px 0 0",
            }}
          >
            <Detail
              label="T-shirt size"
              value={registration.tshirtSize ?? "Not selected"}
            />
            <Detail
              label="Allergies"
              value={registration.allergies.join(", ") || "None reported"}
            />
          </dl>
        </div>
      </div>
    </article>
  );
}

function StatusPill({
  status,
}: {
  status: "confirmed" | "waitlisted" | "cancelled";
}) {
  const tone =
    status === "confirmed"
      ? { color: "#9BE2B8", background: "rgba(34,108,69,.32)" }
      : status === "waitlisted"
        ? { color: "#F2C46D", background: "rgba(121,83,24,.34)" }
        : { color: "rgba(255,249,239,.72)", background: "rgba(18,13,9,.44)" };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "7px 12px 8px",
        border: "1px solid rgba(255,249,239,.22)",
        borderRadius: 999,
        color: tone.color,
        background: tone.background,
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        fontSize: 12,
        fontWeight: 700,
        textTransform: "capitalize",
      }}
    >
      <span
        aria-hidden
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: tone.color,
          boxShadow: `0 0 0 3px ${tone.color}22`,
        }}
      />
      {status}
    </span>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt
        style={{
          margin: "0 0 5px",
          color: ACCENT,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: ".14em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </dt>
      <dd
        style={{
          margin: 0,
          fontSize: 15,
          fontWeight: 650,
          lineHeight: 1.35,
          textShadow: "0 1px 10px rgba(0,0,0,.6)",
        }}
      >
        {value}
      </dd>
    </div>
  );
}

function shell(dark: boolean) {
  return {
    position: "relative",
    boxSizing: "border-box",
    maxWidth: 760,
    margin: "0 auto",
    padding: "26px clamp(24px, 4.5vw, 40px) 34px",
    overflow: "hidden",
    borderRadius: 20,
    border: `1px solid ${
      dark ? "rgba(255,249,239,.1)" : "rgba(43,31,20,.14)"
    }`,
    color: "#FFF9EF",
    background: "#3f3127",
    boxShadow: dark
      ? "0 1px 0 rgba(255,249,239,.07) inset, 0 20px 48px rgba(0,0,0,.42)"
      : "0 1px 0 rgba(255,249,239,.07) inset, 0 16px 40px rgba(43,31,20,.2)",
    fontFamily:
      "Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  } as const;
}

const content = {
  position: "relative",
  display: "flex",
  minHeight: 320,
  flexDirection: "column",
  justifyContent: "space-between",
  gap: 32,
} as const;

function placeholder(dark: boolean) {
  return {
    ...shell(dark),
    display: "grid",
    placeItems: "center",
    minHeight: 160,
    fontSize: 14,
    textAlign: "center",
  } as const;
}

export default function RegistrationDetailView() {
  return (
    <ThemeProvider>
      <RegistrationDetail />
    </ThemeProvider>
  );
}
