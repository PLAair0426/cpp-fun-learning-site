#!/usr/bin/env node

const path = require("path");
const {
  initProject,
  initFullTemplateProject,
  listProfiles,
  syncProject,
} = require("../lib/template-core");

function printHelp() {
  const lines = [
    "agent-project-template",
    "",
    "Usage:",
    "  agent-project-template profiles",
    "  agent-project-template init [options]",
    "  agent-project-template init-full [options]",
    "  agent-project-template sync [options]",
    "",
    "Commands:",
    "  profiles                List built-in template profiles",
    "  init                    Initialize a lightweight project workspace",
    "  init-full               Initialize the full template framework",
    "  sync                    Preview or apply template updates",
    "",
    "Init options:",
    "  --name <value>          Project name",
    "  --slug <value>          Project slug",
    "  --target <path>         Target directory, default: .",
    "  --profile <value>       Template profile",
    "  --config <path>         Project config JSON file",
    "  --force                 Allow writing into a non-empty directory",
    "  --in-place              Initialize directly in the target directory",
    "",
    "Sync options:",
    "  --project-root <path>   Existing project root, default: .",
    "  --profile <value>       Override the current profile",
    "  --config <path>         Project config JSON file",
    "  --include <glob>        Extra managed glob, repeatable",
    "  --exclude <glob>        Extra exclude glob, repeatable",
    "  --dry-run               Preview without writing files",
    "  --force                 Allow touching protected paths",
    "",
    "Examples:",
    "  npx agent-project-template profiles",
    '  npx agent-project-template init --name "Example Project" --slug example-project --target . --profile web-product',
    '  npx agent-project-template init-full --name "Example Project" --slug example-project-template --target . --profile ai-agent-workspace',
    "  npx agent-project-template init --target . --config ./project-config.json",
    "  npx agent-project-template sync --project-root . --dry-run",
    "  npx agent-project-template sync --project-root .",
  ];

  process.stdout.write(`${lines.join("\n")}\n`);
}

function parseArguments(argv) {
  const result = {
    command: null,
    options: {},
  };

  const values = argv.slice(2);
  if (values.length === 0) {
    return result;
  }

  result.command = values[0];

  for (let index = 1; index < values.length; index += 1) {
    const current = values[index];

    if (!current.startsWith("--")) {
      throw new Error(`Unexpected argument: ${current}`);
    }

    const withoutPrefix = current.slice(2);
    const hasInlineValue = withoutPrefix.includes("=");
    const [rawKey, inlineValue] = hasInlineValue
      ? withoutPrefix.split(/=(.*)/s, 2)
      : [withoutPrefix, null];
    const key = rawKey.trim();

    if (!key) {
      throw new Error(`Invalid option: ${current}`);
    }

    const normalizedKey = key.replace(/-([a-z])/g, (_, letter) =>
      letter.toUpperCase(),
    );

    if (inlineValue !== null) {
      appendOption(result.options, normalizedKey, inlineValue);
      continue;
    }

    const next = values[index + 1];
    if (!next || next.startsWith("--")) {
      result.options[normalizedKey] = true;
      continue;
    }

    appendOption(result.options, normalizedKey, next);
    index += 1;
  }

  return result;
}

function appendOption(target, key, value) {
  if (key === "include" || key === "exclude") {
    const items = String(value)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    target[key] = Array.isArray(target[key]) ? target[key] : [];
    target[key].push(...items);
    return;
  }

  target[key] = value;
}

async function main() {
  try {
    const packageRoot = path.resolve(__dirname, "..");
    const { command, options } = parseArguments(process.argv);

    if (!command || command === "help" || command === "--help") {
      printHelp();
      return;
    }

    if (command === "profiles") {
      const profiles = listProfiles({ packageRoot });
      profiles.forEach((profile) => {
        process.stdout.write(`${profile.name}\t${profile.description}\n`);
      });
      return;
    }

    if (command === "init" || command === "bootstrap") {
      const summary = initProject({
        packageRoot,
        projectName: options.name,
        projectSlug: options.slug,
        targetPath: options.target || ".",
        profile: options.profile,
        configFile: options.config,
        force: Boolean(options.force),
        inPlace: Boolean(options.inPlace),
      });

      process.stdout.write(
        `Initialized project at ${summary.projectRoot}\nProfile: ${summary.profile}\nScaffold files copied: ${summary.scaffoldFileCount}\n`,
      );
      return;
    }

    if (command === "init-full" || command === "init-template") {
      const summary = initFullTemplateProject({
        packageRoot,
        projectName: options.name,
        projectSlug: options.slug,
        targetPath: options.target || ".",
        profile: options.profile,
        configFile: options.config,
        force: Boolean(options.force),
        inPlace: Boolean(options.inPlace),
      });

      process.stdout.write(
        `Initialized full template framework at ${summary.projectRoot}\nProfile: ${summary.profile}\nMode: ${summary.initMode}\nScaffold files copied: ${summary.scaffoldFileCount}\n`,
      );
      return;
    }

    if (command === "sync") {
      const summary = syncProject({
        packageRoot,
        projectRoot: options.projectRoot || ".",
        profile: options.profile,
        configFile: options.config,
        includeGlobs: options.include || [],
        excludeGlobs: options.exclude || [],
        dryRun: Boolean(options.dryRun),
        force: Boolean(options.force),
      });

      process.stdout.write(
        `Template sync ${summary.dryRun ? "preview" : "completed"} for ${summary.projectRoot}\n`,
      );
      process.stdout.write(`Profile: ${summary.profile}\n`);
      process.stdout.write(
        `Create: ${summary.counts.create} | Update: ${summary.counts.update} | Unchanged: ${summary.counts.unchanged} | Skipped: ${summary.counts.skipProtected}\n`,
      );
      summary.report.forEach((item) => {
        process.stdout.write(`[${item.action}] ${item.path}\n`);
      });
      return;
    }

    throw new Error(`Unknown command: ${command}`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

main();
