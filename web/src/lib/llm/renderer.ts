import nunjucks from "nunjucks";
import path from "path";
import fs from "fs";

const templatesDir = path.join(
  process.cwd(),
  "src",
  "lib",
  "llm",
  "templates"
);

const env = new nunjucks.Environment(
  new nunjucks.FileSystemLoader(templatesDir),
  { autoescape: false, trimBlocks: true, lstripBlocks: true }
);

export function renderTemplate(
  templateName: string,
  context: Record<string, unknown>
): string {
  // Verify template exists for clear error messages
  const templatePath = path.join(templatesDir, templateName);
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }
  return env.render(templateName, context).trim();
}
