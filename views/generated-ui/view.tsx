import {
  JSONUIProvider,
  Renderer,
  defineRegistry,
} from "@json-render/react";
import type { Spec } from "@json-render/react";
import type { CSSProperties, ReactNode } from "react";
import {
  ThemeProvider,
  useToolContext,
  useViewTheme,
} from "mcp-use/react";
import {
  streamedInputToSpec,
  uiCatalog,
} from "../../src/ui-catalog.js";

const gaps = {
  sm: 8,
  md: 14,
  lg: 22,
} as const;

const { registry } = defineRegistry(uiCatalog, {
  components: {
    Canvas: ({ props, children }) => {
      const { title, eyebrow, description } = props;
      return (
        <article style={canvas}>
          <div aria-hidden style={glow} />
          <header style={{ position: "relative" }}>
            {eyebrow && <p style={eyebrowStyle}>{eyebrow}</p>}
            <h1 style={titleStyle}>{title}</h1>
            {description && <p style={descriptionStyle}>{description}</p>}
          </header>
          <div style={canvasContent}>{children}</div>
        </article>
      );
    },
    Card: ({ props, children }) => {
      const { title, description, tone = "neutral" } = props;
      return (
        <section style={{ ...card, ...toneCard[tone] }}>
          {(title || description) && (
            <header style={{ marginBottom: children ? 16 : 0 }}>
              {title && <h2 style={cardTitle}>{title}</h2>}
              {description && <p style={cardDescription}>{description}</p>}
            </header>
          )}
          {children}
        </section>
      );
    },
    Grid: ({ props, children }) => {
      const { columns = 2, gap = "md" } = props;
      return (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${columns > 2 ? 150 : 210}px), 1fr))`,
            gap: gaps[gap],
          }}
        >
          {children}
        </div>
      );
    },
    Stack: ({ props, children }) => {
      const {
        direction = "vertical",
        gap = "md",
        align = "stretch",
        justify = "start",
      } = props;
      return (
        <div
          style={{
            display: "flex",
            minWidth: 0,
            flexDirection: direction === "horizontal" ? "row" : "column",
            gap: gaps[gap],
            alignItems: alignMap[align],
            justifyContent: justifyMap[justify],
          }}
        >
          {children}
        </div>
      );
    },
    Heading: ({ props }) => {
      const { text, level = "h3" } = props;
      const Tag = level;
      return <Tag style={headingStyle[level]}>{text}</Tag>;
    },
    Text: ({ props }) => {
      const {
        text,
        tone = "default",
        size = "md",
        weight = "regular",
      } = props;
      return (
        <p
          style={{
            margin: 0,
            color: textTone[tone],
            fontSize: textSize[size],
            fontWeight: textWeight[weight],
            lineHeight: 1.45,
          }}
        >
          {text}
        </p>
      );
    },
    Badge: ({ props }) => {
      const { label, tone = "neutral" } = props;
      return <span style={{ ...badge, ...toneBadge[tone] }}>{label}</span>;
    },
    Avatar: ({ props }) => {
      const { name, image, size = "md" } = props;
      const dimensions = avatarSize[size];
      const initials = name
        .split(/\s+/)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
      return image ? (
        <img
          src={image}
          alt={name}
          style={{
            ...avatar,
            width: dimensions,
            height: dimensions,
            objectFit: "cover",
          }}
        />
      ) : (
        <span
          aria-label={name}
          style={{
            ...avatar,
            display: "grid",
            width: dimensions,
            height: dimensions,
            placeItems: "center",
            color: "var(--blossom-accent)",
            background: "var(--blossom-accent-soft)",
            fontSize: Math.round(dimensions * 0.34),
            fontWeight: 750,
            letterSpacing: "-.02em",
          }}
        >
          {initials}
        </span>
      );
    },
    Metric: ({ props }) => {
      const { label, value, detail, tone = "neutral" } = props;
      return (
        <section style={{ ...metric, ...toneCard[tone] }}>
          <p style={metricLabel}>{label}</p>
          <p style={metricValue}>{value}</p>
          {detail && <p style={metricDetail}>{detail}</p>}
        </section>
      );
    },
    Table: ({ props }) => {
      const { caption, columns, rows } = props;
      return (
        <div style={tableWrap}>
          <table style={table}>
            {caption && <caption style={captionStyle}>{caption}</caption>}
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column} style={tableHeader}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={`${rowIndex}-${row.join("-")}`}>
                  {row.map((cell, cellIndex) => (
                    <td key={`${cellIndex}-${cell}`} style={tableCell}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    },
    Divider: () => <hr style={divider} />,
  },
});

function GeneratedUi() {
  const tool = useToolContext<"generate_ui">();
  const dark = useViewTheme() === "dark";
  const streamed =
    tool.status === "pending"
      ? streamedInputToSpec(tool.toolInput)
      : null;

  if (tool.status === "pending" && streamed === null) {
    return <div style={{ ...placeholder, ...themeVariables(dark) }}>Composing the view…</div>;
  }
  if (tool.status === "error") {
    return (
      <div style={{ ...placeholder, ...themeVariables(dark) }} role="alert">
        {tool.error.message}
      </div>
    );
  }

  const spec =
    tool.status === "ready"
      ? tool.toolOutput.spec
      : streamed?.spec ?? null;

  return (
    <div style={{ ...host, ...themeVariables(dark) }}>
      <JSONUIProvider registry={registry} initialState={{}}>
        <Renderer spec={spec as Spec | null} registry={registry} />
      </JSONUIProvider>
      {tool.status === "pending" && streamed && (
        <span style={streamingBadge} aria-live="polite">
          <span style={streamingDot} />
          Building live · {streamed.count} component{streamed.count === 1 ? "" : "s"}
        </span>
      )}
    </div>
  );
}

const alignMap = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  stretch: "stretch",
} as const;

const justifyMap = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  between: "space-between",
} as const;

const textTone = {
  default: "var(--blossom-text)",
  muted: "var(--blossom-muted)",
  accent: "var(--blossom-accent)",
} as const;

const textSize = { sm: 12, md: 14, lg: 17 } as const;
const textWeight = { regular: 450, medium: 560, semibold: 680 } as const;
const avatarSize = { sm: 36, md: 48, lg: 62 } as const;

const toneCard = {
  neutral: {},
  accent: {
    borderColor: "var(--blossom-accent-border)",
    background: "var(--blossom-accent-soft)",
  },
  success: {
    borderColor: "var(--blossom-success-border)",
    background: "var(--blossom-success-soft)",
  },
  warning: {
    borderColor: "var(--blossom-warning-border)",
    background: "var(--blossom-warning-soft)",
  },
} satisfies Record<string, CSSProperties>;

const toneBadge = {
  neutral: {
    color: "var(--blossom-muted)",
    background: "var(--blossom-neutral-soft)",
    borderColor: "var(--blossom-border)",
  },
  accent: {
    color: "var(--blossom-accent)",
    background: "var(--blossom-accent-soft)",
    borderColor: "var(--blossom-accent-border)",
  },
  success: {
    color: "var(--blossom-success)",
    background: "var(--blossom-success-soft)",
    borderColor: "var(--blossom-success-border)",
  },
  warning: {
    color: "var(--blossom-warning)",
    background: "var(--blossom-warning-soft)",
    borderColor: "var(--blossom-warning-border)",
  },
} satisfies Record<string, CSSProperties>;

const host: CSSProperties = {
  position: "relative",
  boxSizing: "border-box",
  width: "100%",
  maxWidth: 780,
  margin: "0 auto",
  color: "var(--blossom-text)",
  fontFamily:
    "Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const streamingBadge: CSSProperties = {
  position: "absolute",
  top: 14,
  right: 14,
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  padding: "6px 9px",
  border: "1px solid var(--blossom-accent-border)",
  borderRadius: 999,
  color: "var(--blossom-accent)",
  background: "var(--blossom-surface)",
  boxShadow: "0 4px 16px rgba(0,0,0,.12)",
  fontSize: 10,
  fontWeight: 750,
  letterSpacing: ".02em",
};

const streamingDot: CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: "50%",
  background: "var(--blossom-accent)",
  boxShadow: "0 0 0 3px var(--blossom-accent-soft)",
};

const canvas: CSSProperties = {
  position: "relative",
  boxSizing: "border-box",
  minHeight: 280,
  padding: "clamp(24px, 4.5vw, 38px)",
  overflow: "hidden",
  border: "1px solid var(--blossom-border)",
  borderRadius: 24,
  background: "var(--blossom-surface)",
  boxShadow: "var(--blossom-shadow)",
};

const glow: CSSProperties = {
  position: "absolute",
  top: -130,
  right: -110,
  width: 330,
  height: 330,
  borderRadius: "50%",
  background:
    "radial-gradient(circle, var(--blossom-glow) 0%, transparent 68%)",
  pointerEvents: "none",
};

const eyebrowStyle: CSSProperties = {
  margin: "0 0 9px",
  color: "var(--blossom-accent)",
  fontSize: 11,
  fontWeight: 750,
  letterSpacing: ".15em",
  textTransform: "uppercase",
};

const titleStyle: CSSProperties = {
  margin: 0,
  maxWidth: 620,
  color: "var(--blossom-text)",
  fontFamily: "Georgia, 'Times New Roman', serif",
  fontSize: "clamp(34px, 6vw, 50px)",
  fontWeight: 500,
  letterSpacing: "-.04em",
  lineHeight: 1.04,
};

const descriptionStyle: CSSProperties = {
  maxWidth: 600,
  margin: "12px 0 0",
  color: "var(--blossom-muted)",
  fontSize: 14,
  lineHeight: 1.5,
};

const canvasContent: CSSProperties = {
  position: "relative",
  display: "flex",
  flexDirection: "column",
  gap: 16,
  marginTop: 26,
};

const card: CSSProperties = {
  boxSizing: "border-box",
  minWidth: 0,
  padding: 18,
  border: "1px solid var(--blossom-border)",
  borderRadius: 18,
  background: "var(--blossom-card)",
  boxShadow: "0 1px 0 var(--blossom-inset) inset",
};

const cardTitle: CSSProperties = {
  margin: 0,
  color: "var(--blossom-text)",
  fontFamily: "Georgia, 'Times New Roman', serif",
  fontSize: 22,
  fontWeight: 550,
  letterSpacing: "-.025em",
};

const cardDescription: CSSProperties = {
  margin: "6px 0 0",
  color: "var(--blossom-muted)",
  fontSize: 13,
  lineHeight: 1.45,
};

const headingStyle = {
  h2: { margin: 0, fontSize: 24, lineHeight: 1.2 },
  h3: { margin: 0, fontSize: 19, lineHeight: 1.25 },
  h4: { margin: 0, fontSize: 15, lineHeight: 1.3 },
} satisfies Record<string, CSSProperties>;

const badge: CSSProperties = {
  display: "inline-flex",
  width: "fit-content",
  alignItems: "center",
  padding: "5px 9px 6px",
  border: "1px solid",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 700,
  lineHeight: 1,
};

const avatar: CSSProperties = {
  boxSizing: "border-box",
  flex: "0 0 auto",
  overflow: "hidden",
  border: "1px solid var(--blossom-accent-border)",
  borderRadius: 15,
};

const metric: CSSProperties = {
  padding: 18,
  border: "1px solid var(--blossom-border)",
  borderRadius: 18,
  background: "var(--blossom-card)",
};

const metricLabel: CSSProperties = {
  margin: 0,
  color: "var(--blossom-muted)",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: ".08em",
  textTransform: "uppercase",
};

const metricValue: CSSProperties = {
  margin: "8px 0 0",
  color: "var(--blossom-text)",
  fontFamily: "Georgia, 'Times New Roman', serif",
  fontSize: 32,
  lineHeight: 1,
};

const metricDetail: CSSProperties = {
  margin: "8px 0 0",
  color: "var(--blossom-muted)",
  fontSize: 12,
};

const tableWrap: CSSProperties = {
  width: "100%",
  overflowX: "auto",
  border: "1px solid var(--blossom-border)",
  borderRadius: 16,
};

const table: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 13,
};

const captionStyle: CSSProperties = {
  padding: "12px 14px",
  color: "var(--blossom-muted)",
  textAlign: "left",
};

const tableHeader: CSSProperties = {
  padding: "10px 14px",
  borderBottom: "1px solid var(--blossom-border)",
  color: "var(--blossom-muted)",
  background: "var(--blossom-neutral-soft)",
  fontSize: 10,
  fontWeight: 750,
  letterSpacing: ".08em",
  textAlign: "left",
  textTransform: "uppercase",
};

const tableCell: CSSProperties = {
  padding: "11px 14px",
  borderBottom: "1px solid var(--blossom-border)",
  color: "var(--blossom-text)",
  textAlign: "left",
};

const divider: CSSProperties = {
  width: "100%",
  margin: "2px 0",
  border: 0,
  borderTop: "1px solid var(--blossom-border)",
};

const placeholder: CSSProperties = {
  ...host,
  display: "grid",
  minHeight: 160,
  placeItems: "center",
  boxSizing: "border-box",
  border: "1px solid var(--blossom-border)",
  borderRadius: 20,
  color: "var(--blossom-muted)",
  background: "var(--blossom-surface)",
  fontSize: 14,
};

function themeVariables(dark: boolean): CSSProperties {
  return {
    "--blossom-text": dark ? "#FFF9EF" : "#2C2119",
    "--blossom-muted": dark ? "rgba(255,249,239,.66)" : "#75685D",
    "--blossom-surface": dark ? "#211A16" : "#FFF9F0",
    "--blossom-card": dark ? "rgba(255,249,239,.045)" : "#FFFCF7",
    "--blossom-border": dark
      ? "rgba(255,249,239,.12)"
      : "rgba(74,52,34,.13)",
    "--blossom-inset": dark
      ? "rgba(255,255,255,.05)"
      : "rgba(255,255,255,.8)",
    "--blossom-neutral-soft": dark
      ? "rgba(255,249,239,.055)"
      : "rgba(87,67,49,.055)",
    "--blossom-accent": dark ? "#F4B66B" : "#B94B34",
    "--blossom-accent-soft": dark
      ? "rgba(232,93,63,.12)"
      : "rgba(232,93,63,.08)",
    "--blossom-accent-border": dark
      ? "rgba(244,182,107,.28)"
      : "rgba(185,75,52,.2)",
    "--blossom-success": dark ? "#9BE2B8" : "#28784B",
    "--blossom-success-soft": dark
      ? "rgba(54,137,88,.15)"
      : "rgba(40,120,75,.08)",
    "--blossom-success-border": dark
      ? "rgba(155,226,184,.25)"
      : "rgba(40,120,75,.18)",
    "--blossom-warning": dark ? "#F2C46D" : "#966614",
    "--blossom-warning-soft": dark
      ? "rgba(169,116,35,.16)"
      : "rgba(150,102,20,.08)",
    "--blossom-warning-border": dark
      ? "rgba(242,196,109,.25)"
      : "rgba(150,102,20,.18)",
    "--blossom-glow": dark
      ? "rgba(232,93,63,.16)"
      : "rgba(232,93,63,.12)",
    "--blossom-shadow": dark
      ? "0 18px 50px rgba(0,0,0,.3)"
      : "0 16px 40px rgba(72,49,30,.12)",
  } as CSSProperties;
}

export default function GeneratedUiView(): ReactNode {
  return (
    <ThemeProvider>
      <GeneratedUi />
    </ThemeProvider>
  );
}
