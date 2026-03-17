import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, "src");
const LOCALES_DIR = path.join(SRC_DIR, "i18n", "locales");
const I18N_ENTRY = path.join(SRC_DIR, "i18n", "index.ts");

function walk(directory, filter) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;

    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath, filter));
      continue;
    }

    if (filter(fullPath)) files.push(fullPath);
  }

  return files;
}

function flattenMessages(value, prefix = "") {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => flattenMessages(item, prefix ? `${prefix}.${index}` : `${index}`));
  }

  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) =>
      flattenMessages(child, prefix ? `${prefix}.${key}` : key)
    );
  }

  return prefix ? [prefix] : [];
}

function collectBlankStrings(value, prefix = "") {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectBlankStrings(item, prefix ? `${prefix}.${index}` : `${index}`));
  }

  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) =>
      collectBlankStrings(child, prefix ? `${prefix}.${key}` : key)
    );
  }

  if (typeof value === "string" && value.trim() === "") {
    return prefix ? [prefix] : [];
  }

  return [];
}

function loadLocales() {
  return Object.fromEntries(
    fs
      .readdirSync(LOCALES_DIR)
      .filter((fileName) => fileName.endsWith(".json"))
      .sort()
      .map((fileName) => [
        fileName.replace(/\.json$/, ""),
        JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, fileName), "utf8")),
      ])
  );
}

function collectTranslationReferences() {
  const sourceFiles = walk(SRC_DIR, (filePath) => /\.(ts|tsx)$/.test(filePath));
  const keyUsage = new Map();
  const importViolations = [];
  const regexes = [
    /\bt\(\s*["'`]([^"'`]+)["'`]/g,
    /\btranslate\([^,]+,\s*["'`]([^"'`]+)["'`]/g,
  ];

  for (const filePath of sourceFiles) {
    const content = fs.readFileSync(filePath, "utf8");
    const relativePath = path.relative(ROOT, filePath);

    if (filePath !== I18N_ENTRY && content.includes("@/i18n/locales/")) {
      importViolations.push(relativePath);
    }

    for (const regex of regexes) {
      let match;
      while ((match = regex.exec(content)) !== null) {
        const key = match[1];
        if (key.includes("${")) continue;
        if (!keyUsage.has(key)) keyUsage.set(key, new Set());
        keyUsage.get(key).add(relativePath);
      }
    }
  }

  return { keyUsage, importViolations };
}

function sortedList(values) {
  return [...values].sort().join(", ");
}

function main() {
  const locales = loadLocales();
  const baseLocale = locales.en;

  if (!baseLocale) {
    console.error("[i18n] Missing base locale file: en.json");
    process.exit(1);
  }

  const localeNames = Object.keys(locales).sort();
  const baseKeys = new Set(flattenMessages(baseLocale));
  const issues = [];

  for (const localeName of localeNames) {
    const localeKeys = new Set(flattenMessages(locales[localeName]));
    const missingKeys = [...baseKeys].filter((key) => !localeKeys.has(key));
    const extraKeys = [...localeKeys].filter((key) => !baseKeys.has(key));
    const blankKeys = collectBlankStrings(locales[localeName]);

    if (missingKeys.length > 0) {
      issues.push(`[i18n] ${localeName} is missing keys: ${sortedList(missingKeys)}`);
    }

    if (extraKeys.length > 0) {
      issues.push(`[i18n] ${localeName} has extra keys: ${sortedList(extraKeys)}`);
    }

    if (blankKeys.length > 0) {
      issues.push(`[i18n] ${localeName} has blank translations: ${sortedList(blankKeys)}`);
    }
  }

  const { keyUsage, importViolations } = collectTranslationReferences();
  const usedKeys = [...keyUsage.keys()].sort();
  const missingUsedKeys = usedKeys.filter((key) => !baseKeys.has(key));
  const legacyStyleKeys = usedKeys.filter((key) => !key.includes("."));

  if (missingUsedKeys.length > 0) {
    issues.push(`[i18n] Keys used in code but missing from en.json: ${missingUsedKeys.join(", ")}`);
  }

  if (legacyStyleKeys.length > 0) {
    issues.push(`[i18n] Legacy flat translation keys still used in code: ${legacyStyleKeys.join(", ")}`);
  }

  if (importViolations.length > 0) {
    issues.push(`[i18n] Locale files are imported outside src/i18n/index.ts: ${importViolations.join(", ")}`);
  }

  if (issues.length > 0) {
    for (const issue of issues) console.error(issue);
    process.exit(1);
  }

  console.log(
    `[i18n] Validation passed for ${localeNames.length} locales and ${usedKeys.length} statically referenced translation keys.`
  );
}

main();
