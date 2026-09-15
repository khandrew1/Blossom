import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { z } from "zod";

const toneSchema = z
  .enum(["neutral", "accent", "success", "warning"])
  .optional();
const sizeSchema = z.enum(["sm", "md", "lg"]).optional();

const canvasPropsSchema = z.object({
  title: z.string().min(1),
  eyebrow: z.string().optional(),
  description: z.string().optional(),
});

const cardPropsSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  tone: toneSchema,
});

const gridPropsSchema = z.object({
  columns: z.number().int().min(1).max(4).optional(),
  gap: sizeSchema,
});

const stackPropsSchema = z.object({
  direction: z.enum(["vertical", "horizontal"]).optional(),
  gap: sizeSchema,
  align: z.enum(["start", "center", "end", "stretch"]).optional(),
  justify: z.enum(["start", "center", "end", "between"]).optional(),
});

const headingPropsSchema = z.object({
  text: z.string().min(1),
  level: z.enum(["h2", "h3", "h4"]).optional(),
});

const textPropsSchema = z.object({
  text: z.string(),
  tone: z.enum(["default", "muted", "accent"]).optional(),
  size: sizeSchema,
  weight: z.enum(["regular", "medium", "semibold"]).optional(),
});

const badgePropsSchema = z.object({
  label: z.string().min(1),
  tone: toneSchema,
});

const avatarPropsSchema = z.object({
  name: z.string().min(1),
  image: z.string().optional(),
  size: sizeSchema,
});

const metricPropsSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
  detail: z.string().optional(),
  tone: toneSchema,
});

const tablePropsSchema = z.object({
  caption: z.string().optional(),
  columns: z.array(z.string()).min(1).max(6),
  rows: z.array(z.array(z.string()).min(1).max(6)).max(20),
});

const dividerPropsSchema = z.object({});

export const uiCatalog = defineCatalog(schema, {
  components: {
    Canvas: {
      props: canvasPropsSchema,
      slots: ["default"],
      description:
        "Root surface for a complete UI. Use exactly one Canvas as the root.",
    },
    Card: {
      props: cardPropsSchema,
      slots: ["default"],
      description: "Group related content in a polished card.",
    },
    Grid: {
      props: gridPropsSchema,
      slots: ["default"],
      description:
        "Responsive grid for peer items such as people, assignments, or metrics.",
    },
    Stack: {
      props: stackPropsSchema,
      slots: ["default"],
      description: "Lay out related elements vertically or horizontally.",
    },
    Heading: {
      props: headingPropsSchema,
      description: "Heading inside a section or card.",
    },
    Text: {
      props: textPropsSchema,
      description: "Short supporting copy or a label-value line.",
    },
    Badge: {
      props: badgePropsSchema,
      description: "Compact status or category label.",
    },
    Avatar: {
      props: avatarPropsSchema,
      description:
        "Person portrait with an initials fallback. Pair with text in a horizontal Stack.",
    },
    Metric: {
      props: metricPropsSchema,
      description: "Prominent single value with a label and optional detail.",
    },
    Table: {
      props: tablePropsSchema,
      description: "Compact table for repeated structured records.",
    },
    Divider: {
      props: dividerPropsSchema,
      description: "Subtle separator between adjacent sections.",
    },
  },
  actions: {},
});

export const uiSpecSchema = uiCatalog.zodSchema();

const elementBase = {
  key: z.string().min(1),
  children: z.array(z.string()).max(30),
};

export const uiComponentSchema = z.discriminatedUnion("type", [
  z.object({ ...elementBase, type: z.literal("Canvas"), props: canvasPropsSchema }),
  z.object({ ...elementBase, type: z.literal("Card"), props: cardPropsSchema }),
  z.object({ ...elementBase, type: z.literal("Grid"), props: gridPropsSchema }),
  z.object({ ...elementBase, type: z.literal("Stack"), props: stackPropsSchema }),
  z.object({ ...elementBase, type: z.literal("Heading"), props: headingPropsSchema }),
  z.object({ ...elementBase, type: z.literal("Text"), props: textPropsSchema }),
  z.object({ ...elementBase, type: z.literal("Badge"), props: badgePropsSchema }),
  z.object({ ...elementBase, type: z.literal("Avatar"), props: avatarPropsSchema }),
  z.object({ ...elementBase, type: z.literal("Metric"), props: metricPropsSchema }),
  z.object({ ...elementBase, type: z.literal("Table"), props: tablePropsSchema }),
  z.object({ ...elementBase, type: z.literal("Divider"), props: dividerPropsSchema }),
]);

export type UiComponent = z.infer<typeof uiComponentSchema>;

export function componentsToSpec(
  root: string,
  components: readonly UiComponent[]
): z.infer<typeof uiSpecSchema> {
  const elements = Object.fromEntries(
    components.map(({ key, ...element }) => [
      key,
      { ...element, visible: true },
    ])
  );
  return uiSpecSchema.parse({ root, elements });
}

export function streamedInputToSpec(input: unknown): {
  spec: z.infer<typeof uiSpecSchema>;
  count: number;
} | null {
  if (typeof input !== "object" || input === null) return null;
  const candidate = input as {
    root?: unknown;
    components?: unknown;
  };
  if (
    typeof candidate.root !== "string" ||
    !Array.isArray(candidate.components)
  ) {
    return null;
  }

  const components: UiComponent[] = [];
  const seen = new Set<string>();
  for (const rawComponent of candidate.components) {
    const parsed = uiComponentSchema.safeParse(rawComponent);
    if (!parsed.success || seen.has(parsed.data.key)) continue;
    seen.add(parsed.data.key);
    components.push(parsed.data);
  }
  if (!seen.has(candidate.root)) return null;

  const renderable = components.map((component) => ({
    ...component,
    children: component.children.filter((child) => seen.has(child)),
  }));

  try {
    return {
      spec: componentsToSpec(candidate.root, renderable),
      count: renderable.length,
    };
  } catch {
    return null;
  }
}
