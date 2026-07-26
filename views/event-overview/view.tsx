import {
  Image,
  ThemeProvider,
  useToolContext,
  useViewTheme,
} from "mcp-use/react";

function EventOverviewCard() {
  const tool = useToolContext<"get_event_overview">();
  const theme = useViewTheme();
  const dark = theme === "dark";

  if (tool.status === "pending") {
    return <div style={placeholder(dark)}>Gathering the event details…</div>;
  }
  if (tool.status === "error") {
    return <div style={placeholder(dark)} role="alert">{tool.error.message}</div>;
  }

  const event = tool.toolOutput;
  const locationParts = event.location.split(" · ");
  const venue = locationParts[0] ?? event.location;
  const address = locationParts.slice(1);

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
            "linear-gradient(0deg, rgba(10,8,6,.9) 0%, rgba(10,8,6,.58) 26%, rgba(10,8,6,.14) 58%, rgba(10,8,6,0) 88%)",
          ].join(","),
        }}
      />

      <div
        style={{
          position: "relative",
          display: "flex",
          minHeight: 320,
          flexDirection: "column",
          justifyContent: "space-between",
          gap: 32,
        }}
      >
        <div style={{ display: "flex" }}>
          <p
            style={{
              margin: 0,
              display: "inline-flex",
              alignItems: "baseline",
              gap: 7,
              padding: "7px 13px 8px",
              borderRadius: 999,
              border: "1px solid rgba(255,249,239,.2)",
              background: "rgba(18,13,9,.42)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          >
            <strong style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-.015em" }}>
              {event.confirmedCount}
            </strong>
            <span style={{ fontSize: 13, opacity: .88 }}>confirmed guests</span>
          </p>
        </div>

        <div>
          <p
            style={{
              margin: "0 0 14px",
              fontSize: 11.5,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: ".16em",
              opacity: .82,
              textShadow: "0 1px 8px rgba(0,0,0,.5)",
            }}
          >
            {event.date} <span aria-hidden style={{ opacity: .5 }}>·</span> {event.time}
          </p>

          <h1
            style={{
              // Nudged left so the serif cap aligns optically with the text below it.
              margin: "0 0 0 -.035em",
              maxWidth: 620,
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "clamp(40px, 7.2vw, 62px)",
              lineHeight: 1,
              fontWeight: 500,
              letterSpacing: "-.04em",
              textShadow: "0 3px 22px rgba(0,0,0,.5)",
            }}
          >
            {event.name}
          </h1>

          <p
            style={{
              margin: "14px 0 0",
              maxWidth: 480,
              fontSize: 14,
              lineHeight: 1.45,
              opacity: .88,
              textShadow: "0 1px 10px rgba(0,0,0,.55)",
            }}
          >
            <span style={{ fontWeight: 600 }}>{venue}</span>
            {address.length > 0 && (
              <span style={{ opacity: .82 }}>
                {" "}<span aria-hidden style={{ opacity: .55 }}>·</span> {address.join(", ")}
              </span>
            )}
          </p>
        </div>
      </div>
    </article>
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
    border: `1px solid ${dark ? "rgba(255,249,239,.1)" : "rgba(43,31,20,.14)"}`,
    color: "#FFF9EF",
    background: "#3f3127",
    boxShadow: dark
      ? "0 1px 0 rgba(255,249,239,.07) inset, 0 20px 48px rgba(0,0,0,.42)"
      : "0 1px 0 rgba(255,249,239,.07) inset, 0 16px 40px rgba(43,31,20,.2)",
    fontFamily: "Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  } as const;
}

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

export default function EventOverviewView() {
  return <ThemeProvider><EventOverviewCard /></ThemeProvider>;
}
