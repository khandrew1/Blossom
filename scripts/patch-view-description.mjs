// mcp-use 2.0.0-beta.61 omits its view description from resource metadata.
// Keep the documented ChatGPT alias until the SDK emits it natively.
import { readFile, writeFile } from "node:fs/promises";

const entry = import.meta.resolve("mcp-use");
const source = await readFile(new URL(entry), "utf8");
const original = "function buildResourceUiMeta(authorFacts,options){";
const patched = "function buildResourceUiMeta(authorFacts,options){" +
  "const descriptionMeta=authorFacts?.description===undefined?{}:{\"openai/widgetDescription\":authorFacts.description};";
if (!source.includes(patched)) {
  const start = source.indexOf(original);
  const end = source.indexOf("function viewResourceConfig", start);
  if (start < 0 || end < 0) throw new Error("Review the view-description patch for this mcp-use version");
  const body = source.slice(start, end);
  if (!body.includes("return") || !body.includes(",{ui}}")) {
    throw new Error("Unexpected mcp-use resource metadata implementation");
  }
  const updated = body.replace(original, patched).replace(",{ui}}", ",{...descriptionMeta,ui}}");
  await writeFile(new URL(entry), source.slice(0, start) + updated + source.slice(end));
}
