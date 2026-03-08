const fs = require("fs");
const path = require("path");

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeRelativePath(value) {
  return String(value || "")
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .replace(/^\/+/, "");
}

function escapeRegexCharacter(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function readJson(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return {};
  }

  const raw = fs.readFileSync(filePath, "utf8").trim();
  if (!raw) {
    return {};
  }

  return JSON.parse(raw);
}

function removeUnresolvedTemplateTokens(input) {
  if (input === null || input === undefined) {
    return null;
  }

  if (Array.isArray(input)) {
    return input
      .map((item) => removeUnresolvedTemplateTokens(item))
      .filter((item) => item !== null && item !== undefined);
  }

  if (isPlainObject(input)) {
    const result = {};
    Object.entries(input).forEach(([key, value]) => {
      const cleaned = removeUnresolvedTemplateTokens(value);
      if (cleaned !== null && cleaned !== undefined) {
        result[key] = cleaned;
      }
    });
    return result;
  }

  if (
    typeof input === "string" &&
    /^\{\{[A-Z0-9_]+\}\}$/.test(input.trim())
  ) {
    return null;
  }

  return input;
}

function mergeUniqueArray(left, right) {
  const result = [];
  [...(left || []), ...(right || [])]
    .map((item) => (item === null || item === undefined ? "" : String(item)))
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((item) => {
      if (!result.includes(item)) {
        result.push(item);
      }
    });
  return result;
}

function mergeConfig(base, override) {
  const result = isPlainObject(base) ? { ...base } : {};

  if (!isPlainObject(override)) {
    return result;
  }

  Object.entries(override).forEach(([key, value]) => {
    const existing = result[key];

    if (Array.isArray(existing) && Array.isArray(value)) {
      result[key] = mergeUniqueArray(existing, value);
      return;
    }

    if (isPlainObject(existing) && isPlainObject(value)) {
      result[key] = mergeConfig(existing, value);
      return;
    }

    result[key] = value;
  });

  return result;
}

function getConfigValue(config, pathSegments, defaultValue = null) {
  let current = config;
  for (const segment of pathSegments) {
    if (!isPlainObject(current) || !(segment in current)) {
      return defaultValue;
    }
    current = current[segment];
  }
  return current ?? defaultValue;
}

function getConfigArray(config, pathSegments) {
  const value = getConfigValue(config, pathSegments, []);
  if (Array.isArray(value)) {
    return value;
  }
  if (value === null || value === undefined) {
    return [];
  }
  return [value];
}

function resolvePathCandidate(pathValue, searchRoots) {
  if (!pathValue) {
    return null;
  }

  if (path.isAbsolute(pathValue)) {
    return path.resolve(pathValue);
  }

  for (const root of searchRoots) {
    if (!root) {
      continue;
    }
    const candidate = path.resolve(root, pathValue);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return path.resolve(searchRoots[0], pathValue);
}

function resolveProjectSlug(projectName, projectSlug) {
  if (projectSlug && String(projectSlug).trim()) {
    return String(projectSlug).trim();
  }

  if (!projectName || !String(projectName).trim()) {
    return null;
  }

  const candidate = String(projectName)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (candidate) {
    return candidate;
  }

  return `project-${new Date()
    .toISOString()
    .replace(/[-:.TZ]/g, "")
    .slice(0, 14)}`;
}

function listFilesRecursive(rootDir) {
  const results = [];

  function visit(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    entries.forEach((entry) => {
      const absolutePath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        visit(absolutePath);
        return;
      }
      if (entry.isFile()) {
        results.push(
          normalizeRelativePath(path.relative(rootDir, absolutePath)),
        );
      }
    });
  }

  visit(rootDir);
  return results.sort();
}

function globToRegex(pattern) {
  const normalized = normalizeRelativePath(pattern);
  let expression = "^";

  for (let index = 0; index < normalized.length; index += 1) {
    const current = normalized[index];
    const next = normalized[index + 1];

    if (current === "*" && next === "*") {
      expression += ".*";
      index += 1;
      continue;
    }

    if (current === "*") {
      expression += "[^/]*";
      continue;
    }

    if (current === "?") {
      expression += ".";
      continue;
    }

    expression += escapeRegexCharacter(current);
  }

  expression += "$";
  return new RegExp(expression);
}

function resolveRelativeGlobs(rootDir, patterns) {
  const files = listFilesRecursive(rootDir);
  const resolved = [];

  (patterns || []).forEach((pattern) => {
    const regex = globToRegex(pattern);
    files.forEach((file) => {
      if (regex.test(file) && !resolved.includes(file)) {
        resolved.push(file);
      }
    });
  });

  return resolved.sort();
}

function matchesAnyPattern(relativePath, patterns) {
  const normalizedPath = normalizeRelativePath(relativePath);
  return (patterns || []).some((pattern) => {
    const normalizedPattern = String(pattern || "").endsWith("/")
      ? `${String(pattern)}*`
      : String(pattern || "");
    return globToRegex(normalizedPattern).test(normalizeRelativePath(normalizedPath));
  });
}

function ensureDirectory(directoryPath) {
  fs.mkdirSync(directoryPath, { recursive: true });
}

function writeUtf8File(filePath, content) {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf8");
}

function isTextTemplateFile(relativePath, textExtensions) {
  return (textExtensions || []).includes(
    path.extname(relativePath).toLowerCase(),
  );
}

function expandTemplatePlaceholders(content, variables) {
  return Object.keys(variables)
    .sort((left, right) => right.length - left.length)
    .reduce((result, key) => {
      return result.split(`{{${key}}}`).join(String(variables[key]));
    }, content);
}

function renderTemplateContent(sourceRoot, relativePath, textExtensions, variables) {
  const sourcePath = path.join(sourceRoot, relativePath);
  if (!isTextTemplateFile(relativePath, textExtensions)) {
    return null;
  }

  const content = fs.readFileSync(sourcePath, "utf8");
  return expandTemplatePlaceholders(content, variables);
}

function writeManagedTemplateFile({
  sourceRoot,
  destinationRoot,
  relativePath,
  textExtensions,
  variables,
}) {
  const sourcePath = path.join(sourceRoot, relativePath);
  const destinationPath = path.join(destinationRoot, relativePath);

  ensureDirectory(path.dirname(destinationPath));

  if (isTextTemplateFile(relativePath, textExtensions)) {
    const rendered = renderTemplateContent(
      sourceRoot,
      relativePath,
      textExtensions,
      variables,
    );
    writeUtf8File(destinationPath, rendered);
    return;
  }

  fs.copyFileSync(sourcePath, destinationPath);
}

function getManagedFileAction({
  sourceRoot,
  destinationRoot,
  relativePath,
  textExtensions,
  variables,
}) {
  const destinationPath = path.join(destinationRoot, relativePath);
  if (!fs.existsSync(destinationPath)) {
    return "create";
  }

  if (isTextTemplateFile(relativePath, textExtensions)) {
    const rendered = renderTemplateContent(
      sourceRoot,
      relativePath,
      textExtensions,
      variables,
    );
    const existing = fs.readFileSync(destinationPath, "utf8");
    return existing === rendered ? "unchanged" : "update";
  }

  return "update";
}

function newScaffoldPlan(manifest, profileConfig, projectConfig) {
  return {
    directories: mergeUniqueArray(
      getConfigArray(manifest, ["baseDirectories"]),
      mergeUniqueArray(
        getConfigArray(profileConfig, ["extraDirectories"]),
        getConfigArray(projectConfig, ["scaffold", "extraDirectories"]),
      ),
    ),
    includeGlobs: mergeUniqueArray(
      getConfigArray(manifest, ["scaffoldGlobs"]),
      mergeUniqueArray(
        getConfigArray(profileConfig, ["includeGlobs"]),
        getConfigArray(projectConfig, ["scaffold", "includeGlobs"]),
      ),
    ),
    excludeGlobs: mergeUniqueArray(
      getConfigArray(profileConfig, ["excludeGlobs"]),
      getConfigArray(projectConfig, ["scaffold", "excludeGlobs"]),
    ),
    managedGlobs: mergeUniqueArray(
      getConfigArray(manifest, ["syncDefaults", "managedGlobs"]),
      mergeUniqueArray(
        getConfigArray(profileConfig, ["sync", "managedExtraGlobs"]),
        getConfigArray(projectConfig, ["scaffold", "includeGlobs"]),
      ),
    ),
    protectedPrefixes: mergeUniqueArray(
      getConfigArray(manifest, ["syncDefaults", "protectedPrefixes"]),
      mergeUniqueArray(
        getConfigArray(profileConfig, ["sync", "protectedPrefixes"]),
        getConfigArray(projectConfig, ["scaffold", "protectedPrefixes"]),
      ),
    ),
  };
}

function buildVariables({
  manifest,
  profileConfig,
  projectConfig,
  projectName,
  projectSlug,
  profile,
}) {
  const variables = mergeConfig(
    getConfigValue(profileConfig, ["variables"], {}),
    getConfigValue(projectConfig, ["variables"], {}),
  );

  variables.PROJECT_NAME = projectName;
  variables.PROJECT_SLUG = projectSlug;
  variables.PROJECT_PROFILE = profile;
  variables.TEMPLATE_VERSION = String(
    getConfigValue(manifest, ["templateVersion"], "1.0.0"),
  );
  variables.PROJECT_TYPE = variables.PROJECT_TYPE || profile;
  variables.PRIMARY_STACK = variables.PRIMARY_STACK || "TBD";
  variables.DEPLOYMENT_MODE = variables.DEPLOYMENT_MODE || "Docker";
  variables.OWNER = variables.OWNER || "TBD";
  variables.DEFAULT_LANGUAGE = variables.DEFAULT_LANGUAGE || "zh-CN";

  return variables;
}

function getTemplateContext(packageRoot) {
  const templateRoot = path.join(packageRoot, "templates");
  const manifestPath = path.join(templateRoot, "template-manifest.json");
  const manifest = readJson(manifestPath);
  return { templateRoot, manifest };
}

function readProjectConfig(configFile, searchRoots) {
  const configPath = resolvePathCandidate(configFile, searchRoots);
  return removeUnresolvedTemplateTokens(readJson(configPath));
}

function getProfileConfig(templateRoot, profile) {
  const profilePath = path.join(templateRoot, "profiles", `${profile}.json`);
  if (!fs.existsSync(profilePath)) {
    throw new Error(`Profile not found: ${profile}`);
  }
  return readJson(profilePath);
}

function ensureWritableDirectory(targetPath, force) {
  if (!fs.existsSync(targetPath)) {
    return;
  }

  const stat = fs.statSync(targetPath);
  if (!stat.isDirectory()) {
    throw new Error(`Target path is not a directory: ${targetPath}`);
  }

  const entries = fs.readdirSync(targetPath);
  if (entries.length > 0 && !force) {
    throw new Error(
      `Target directory already exists and is not empty: ${targetPath}. Use --force to continue.`,
    );
  }
}

function resolveInitContext(options) {
  const {
    packageRoot,
    projectName,
    projectSlug,
    targetPath = ".",
    profile,
    configFile,
    force = false,
    inPlace = false,
  } = options;

  const { templateRoot, manifest } = getTemplateContext(packageRoot);
  const projectConfig = readProjectConfig(configFile, [process.cwd(), packageRoot]);

  const selectedProfile =
    profile ||
    getConfigValue(projectConfig, ["project", "profile"], null) ||
    getConfigValue(manifest, ["defaultProfile"], "web-product");

  const profileConfig = getProfileConfig(templateRoot, selectedProfile);
  const resolvedProjectName =
    projectName ||
    getConfigValue(projectConfig, ["project", "name"], null);

  if (!resolvedProjectName) {
    throw new Error(
      "Project name is required. Use --name or provide project.name in the config file.",
    );
  }

  const requestedSlug =
    projectSlug ||
    getConfigValue(projectConfig, ["project", "slug"], null);
  const resolvedProjectSlug = resolveProjectSlug(
    resolvedProjectName,
    requestedSlug,
  );

  if (!resolvedProjectSlug) {
    throw new Error(
      "Project slug could not be resolved. Use --slug or provide project.slug in the config file.",
    );
  }

  const targetBasePath = path.resolve(process.cwd(), targetPath);
  ensureDirectory(targetBasePath);

  const projectRoot = inPlace
    ? targetBasePath
    : path.join(targetBasePath, resolvedProjectSlug);

  ensureWritableDirectory(projectRoot, force);

  const scaffoldPlan = newScaffoldPlan(manifest, profileConfig, projectConfig);
  const variables = buildVariables({
    manifest,
    profileConfig,
    projectConfig,
    projectName: resolvedProjectName,
    projectSlug: resolvedProjectSlug,
    profile: selectedProfile,
  });

  return {
    manifest,
    projectConfig,
    profileConfig,
    selectedProfile,
    resolvedProjectName,
    resolvedProjectSlug,
    projectRoot,
    scaffoldPlan,
    variables,
  };
}

function buildFullTemplateScaffoldPlan(manifest, scaffoldPlan) {
  const frameworkGlobs = getConfigArray(manifest, ["frameworkGlobs"]);
  const frameworkDirectories = getConfigArray(manifest, ["frameworkDirectories"]);

  return {
    directories: mergeUniqueArray(scaffoldPlan.directories, frameworkDirectories),
    includeGlobs: mergeUniqueArray(scaffoldPlan.includeGlobs, frameworkGlobs),
    excludeGlobs: scaffoldPlan.excludeGlobs,
    managedGlobs: mergeUniqueArray(scaffoldPlan.managedGlobs, frameworkGlobs),
    protectedPrefixes: scaffoldPlan.protectedPrefixes,
  };
}

function materializeProjectScaffold({
  packageRoot,
  manifest,
  selectedProfile,
  resolvedProjectName,
  resolvedProjectSlug,
  projectRoot,
  scaffoldPlan,
  variables,
  initMode,
}) {
  ensureDirectory(projectRoot);
  scaffoldPlan.directories.forEach((directory) => {
    ensureDirectory(path.join(projectRoot, directory));
  });

  const scaffoldFiles = resolveRelativeGlobs(
    packageRoot,
    scaffoldPlan.includeGlobs,
  ).filter(
    (relativePath) =>
      !matchesAnyPattern(relativePath, scaffoldPlan.excludeGlobs),
  );

  scaffoldFiles.forEach((relativePath) => {
    writeManagedTemplateFile({
      sourceRoot: packageRoot,
      destinationRoot: projectRoot,
      relativePath,
      textExtensions: manifest.textExtensions,
      variables,
    });
  });

  const state = {
    initMode,
    templateVersion: variables.TEMPLATE_VERSION,
    generatedAt: new Date().toISOString(),
    sourceTemplateRoot: packageRoot,
    profile: selectedProfile,
    project: {
      name: resolvedProjectName,
      slug: resolvedProjectSlug,
    },
    variables,
    scaffold: {
      directories: scaffoldPlan.directories,
      includeGlobs: scaffoldPlan.includeGlobs,
      excludeGlobs: scaffoldPlan.excludeGlobs,
      managedGlobs: scaffoldPlan.managedGlobs,
      protectedPrefixes: scaffoldPlan.protectedPrefixes,
    },
  };

  writeUtf8File(
    path.join(projectRoot, ".template", "template-state.json"),
    `${JSON.stringify(state, null, 2)}\n`,
  );

  return {
    projectRoot,
    profile: selectedProfile,
    initMode,
    scaffoldFileCount: scaffoldFiles.length,
  };
}

function initProject(options) {
  const context = resolveInitContext(options);

  return materializeProjectScaffold({
    packageRoot: options.packageRoot,
    manifest: context.manifest,
    selectedProfile: context.selectedProfile,
    resolvedProjectName: context.resolvedProjectName,
    resolvedProjectSlug: context.resolvedProjectSlug,
    projectRoot: context.projectRoot,
    scaffoldPlan: context.scaffoldPlan,
    variables: context.variables,
    initMode: "workspace",
  });
}

function initFullTemplateProject(options) {
  const context = resolveInitContext(options);
  const frameworkScaffoldPlan = buildFullTemplateScaffoldPlan(
    context.manifest,
    context.scaffoldPlan,
  );

  return materializeProjectScaffold({
    packageRoot: options.packageRoot,
    manifest: context.manifest,
    selectedProfile: context.selectedProfile,
    resolvedProjectName: context.resolvedProjectName,
    resolvedProjectSlug: context.resolvedProjectSlug,
    projectRoot: context.projectRoot,
    scaffoldPlan: frameworkScaffoldPlan,
    variables: context.variables,
    initMode: "framework",
  });
}

function syncProject(options) {
  const {
    packageRoot,
    projectRoot = ".",
    profile,
    configFile,
    includeGlobs = [],
    excludeGlobs = [],
    dryRun = false,
    force = false,
  } = options;

  const { templateRoot, manifest } = getTemplateContext(packageRoot);
  const resolvedProjectRoot = path.resolve(process.cwd(), projectRoot);

  if (!fs.existsSync(resolvedProjectRoot)) {
    throw new Error(`Project root not found: ${resolvedProjectRoot}`);
  }

  const statePath = path.join(
    resolvedProjectRoot,
    ".template",
    "template-state.json",
  );
  if (!fs.existsSync(statePath)) {
    throw new Error(
      `Missing template state: ${statePath}. Initialize the project before syncing.`,
    );
  }

  const state = readJson(statePath);
  const projectConfig = readProjectConfig(configFile, [
    process.cwd(),
    resolvedProjectRoot,
    packageRoot,
  ]);

  const selectedProfile =
    profile ||
    getConfigValue(projectConfig, ["project", "profile"], null) ||
    getConfigValue(state, ["profile"], null) ||
    getConfigValue(manifest, ["defaultProfile"], "web-product");

  const profileConfig = getProfileConfig(templateRoot, selectedProfile);
  const resolvedProjectName =
    getConfigValue(projectConfig, ["project", "name"], null) ||
    getConfigValue(state, ["project", "name"], path.basename(resolvedProjectRoot));
  const resolvedProjectSlug = resolveProjectSlug(
    resolvedProjectName,
    getConfigValue(projectConfig, ["project", "slug"], null) ||
      getConfigValue(state, ["project", "slug"], path.basename(resolvedProjectRoot)),
  );

  const scaffoldPlan = newScaffoldPlan(manifest, profileConfig, projectConfig);
  scaffoldPlan.directories = mergeUniqueArray(
    getConfigArray(state, ["scaffold", "directories"]),
    scaffoldPlan.directories,
  );
  scaffoldPlan.includeGlobs = mergeUniqueArray(
    getConfigArray(state, ["scaffold", "includeGlobs"]),
    scaffoldPlan.includeGlobs,
  );
  scaffoldPlan.excludeGlobs = mergeUniqueArray(
    getConfigArray(state, ["scaffold", "excludeGlobs"]),
    scaffoldPlan.excludeGlobs,
  );
  scaffoldPlan.managedGlobs = mergeUniqueArray(
    getConfigArray(state, ["scaffold", "managedGlobs"]),
    scaffoldPlan.managedGlobs,
  );
  scaffoldPlan.protectedPrefixes = mergeUniqueArray(
    getConfigArray(state, ["scaffold", "protectedPrefixes"]),
    scaffoldPlan.protectedPrefixes,
  );
  scaffoldPlan.managedGlobs = mergeUniqueArray(
    scaffoldPlan.managedGlobs,
    includeGlobs,
  );
  scaffoldPlan.excludeGlobs = mergeUniqueArray(
    scaffoldPlan.excludeGlobs,
    excludeGlobs,
  );

  const variables = mergeConfig(
    mergeConfig(
      getConfigValue(profileConfig, ["variables"], {}),
      getConfigValue(state, ["variables"], {}),
    ),
    getConfigValue(projectConfig, ["variables"], {}),
  );

  const finalVariables = buildVariables({
    manifest,
    profileConfig: { variables },
    projectConfig: { variables: {} },
    projectName: resolvedProjectName,
    projectSlug: resolvedProjectSlug,
    profile: selectedProfile,
  });

  if (!dryRun) {
    scaffoldPlan.directories.forEach((directory) => {
      ensureDirectory(path.join(resolvedProjectRoot, directory));
    });
  }

  const managedFiles = resolveRelativeGlobs(
    packageRoot,
    scaffoldPlan.managedGlobs,
  ).filter(
    (relativePath) =>
      !matchesAnyPattern(relativePath, scaffoldPlan.excludeGlobs),
  );

  const report = managedFiles.map((relativePath) => {
    if (
      matchesAnyPattern(relativePath, scaffoldPlan.protectedPrefixes) &&
      !force
    ) {
      return { path: relativePath, action: "skip-protected" };
    }

    const action = getManagedFileAction({
      sourceRoot: packageRoot,
      destinationRoot: resolvedProjectRoot,
      relativePath,
      textExtensions: manifest.textExtensions,
      variables: finalVariables,
    });

    if (!dryRun && action !== "unchanged") {
      writeManagedTemplateFile({
        sourceRoot: packageRoot,
        destinationRoot: resolvedProjectRoot,
        relativePath,
        textExtensions: manifest.textExtensions,
        variables: finalVariables,
      });
    }

    return { path: relativePath, action };
  });

  if (!dryRun) {
    const updatedState = {
      initMode: getConfigValue(state, ["initMode"], "workspace"),
      templateVersion: finalVariables.TEMPLATE_VERSION,
      generatedAt: getConfigValue(state, ["generatedAt"], new Date().toISOString()),
      lastSyncedAt: new Date().toISOString(),
      sourceTemplateRoot: packageRoot,
      profile: selectedProfile,
      project: {
        name: resolvedProjectName,
        slug: resolvedProjectSlug,
      },
      variables: finalVariables,
      scaffold: {
        directories: scaffoldPlan.directories,
        includeGlobs: scaffoldPlan.includeGlobs,
        excludeGlobs: scaffoldPlan.excludeGlobs,
        managedGlobs: scaffoldPlan.managedGlobs,
        protectedPrefixes: scaffoldPlan.protectedPrefixes,
      },
    };

    writeUtf8File(statePath, `${JSON.stringify(updatedState, null, 2)}\n`);
  }

  const counts = {
    create: report.filter((item) => item.action === "create").length,
    update: report.filter((item) => item.action === "update").length,
    unchanged: report.filter((item) => item.action === "unchanged").length,
    skipProtected: report.filter((item) => item.action === "skip-protected")
      .length,
  };

  return {
    dryRun,
    projectRoot: resolvedProjectRoot,
    profile: selectedProfile,
    counts,
    report,
  };
}

function listProfiles({ packageRoot }) {
  const profilesDirectory = path.join(packageRoot, "templates", "profiles");
  return fs
    .readdirSync(profilesDirectory)
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      const profile = readJson(path.join(profilesDirectory, file));
      return {
        name: profile.profile || path.basename(file, ".json"),
        description: profile.description || "",
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

module.exports = {
  initProject,
  initFullTemplateProject,
  listProfiles,
  syncProject,
};
