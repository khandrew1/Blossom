import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  componentsToSpec,
  streamedInputToSpec,
  uiCatalog,
  uiComponentSchema,
} from "../src/ui-catalog.js";

const components = [
  {
    key: "root",
    type: "Canvas" as const,
    props: {
      eyebrow: "Blossom Hill Cafe",
      title: "Event team",
    },
    children: ["team"],
  },
  {
    key: "team",
    type: "Grid" as const,
    props: { columns: 2 as const, gap: "md" as const },
    children: ["maya"],
  },
  {
    key: "maya",
    type: "Card" as const,
    props: { title: "Maya Chen", tone: "accent" as const },
    children: ["maya-role"],
  },
  {
    key: "maya-role",
    type: "Text" as const,
    props: { text: "Manage pastries", weight: "semibold" as const },
    children: [],
  },
];

describe("generated UI catalog", () => {
  it("builds and validates a complete json-render spec", () => {
    const spec = componentsToSpec("root", components);
    assert.equal(uiCatalog.validate(spec).success, true);
    assert.equal(spec.root, "root");
    assert.equal(Object.keys(spec.elements).length, 4);
  });

  it("rejects components outside the presentation catalog", () => {
    assert.equal(
      uiComponentSchema.safeParse({
        key: "script",
        type: "Script",
        props: { code: "alert(1)" },
        children: [],
      }).success,
      false
    );
  });

  it("turns progressive tool input into incrementally renderable specs", () => {
    const firstFrame = streamedInputToSpec({
      root: "root",
      components: [
        components[0],
        {
          key: "team",
          type: "Grid",
          props: {},
        },
      ],
    });
    assert.equal(firstFrame?.count, 1);
    assert.deepEqual(firstFrame?.spec.elements.root?.children, []);

    const secondFrame = streamedInputToSpec({
      root: "root",
      components: components.slice(0, 2),
    });
    assert.equal(secondFrame?.count, 2);
    assert.deepEqual(secondFrame?.spec.elements.root?.children, ["team"]);
    assert.deepEqual(secondFrame?.spec.elements.team?.children, []);

    const finalFrame = streamedInputToSpec({
      root: "root",
      components,
    });
    assert.equal(finalFrame?.count, 4);
    assert.deepEqual(finalFrame?.spec.elements.team?.children, ["maya"]);
  });
});
