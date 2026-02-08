export interface ExtractedDependency {
  name: string;
  version?: string;
  type: 'production' | 'dev' | 'peer' | 'optional';
}

export interface ProjectMeta {
  version: string | null;
  license: string | null;
}

type DependencyExtractor = (content: string) => ExtractedDependency[];
type MetaExtractor = (content: string) => ProjectMeta;

// ─── package.json (npm / yarn / pnpm) ─────────────────────────────

export function extractPackageJson(content: string): ExtractedDependency[] {
  const parsed = JSON.parse(content);
  const result: ExtractedDependency[] = [];

  const sections: { key: string; type: ExtractedDependency['type'] }[] = [
    { key: 'dependencies', type: 'production' },
    { key: 'devDependencies', type: 'dev' },
    { key: 'peerDependencies', type: 'peer' },
    { key: 'optionalDependencies', type: 'optional' },
  ];

  for (const { key, type } of sections) {
    const deps = parsed[key];
    if (deps && typeof deps === 'object') {
      for (const [name, version] of Object.entries(deps)) {
        result.push({ name, version: String(version), type });
      }
    }
  }

  return result;
}

// ─── requirements.txt (pip) ────────────────────────────────────────

export function extractRequirementsTxt(
  content: string,
): ExtractedDependency[] {
  const result: ExtractedDependency[] = [];

  for (const raw of content.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || line.startsWith('-')) continue;

    const match = line.match(/^([a-zA-Z0-9_.-]+)\s*(.*)$/);
    if (!match) continue;

    const name = match[1];
    const versionSpec = match[2].trim();
    const version = versionSpec
      ? versionSpec.replace(/^[=<>!~]+/, '').trim()
      : undefined;

    result.push({ name, version, type: 'production' });
  }

  return result;
}

// ─── composer.json (PHP) ───────────────────────────────────────────

export function extractComposerJson(content: string): ExtractedDependency[] {
  const parsed = JSON.parse(content);
  const result: ExtractedDependency[] = [];

  if (parsed.require && typeof parsed.require === 'object') {
    for (const [name, version] of Object.entries(parsed.require)) {
      if (name === 'php') continue;
      result.push({ name, version: String(version), type: 'production' });
    }
  }

  if (parsed['require-dev'] && typeof parsed['require-dev'] === 'object') {
    for (const [name, version] of Object.entries(parsed['require-dev'])) {
      result.push({ name, version: String(version), type: 'dev' });
    }
  }

  return result;
}

// ─── Gemfile (Ruby / Bundler) ─────────────────────────────────────

export function extractGemfile(content: string): ExtractedDependency[] {
  const result: ExtractedDependency[] = [];
  let currentGroup: ExtractedDependency['type'] = 'production';

  for (const raw of content.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;

    if (line.startsWith('group')) {
      currentGroup =
        line.includes(':development') || line.includes(':test')
          ? 'dev'
          : 'production';
      continue;
    }
    if (line === 'end') {
      currentGroup = 'production';
      continue;
    }

    const match = line.match(
      /^gem\s+['"]([^'"]+)['"](?:\s*,\s*['"]([^'"]+)['"])?/,
    );
    if (match) {
      result.push({
        name: match[1],
        version: match[2] || undefined,
        type: currentGroup,
      });
    }
  }

  return result;
}

// ─── go.mod (Go modules) ─────────────────────────────────────────

export function extractGoMod(content: string): ExtractedDependency[] {
  const result: ExtractedDependency[] = [];
  let inRequireBlock = false;

  for (const raw of content.split('\n')) {
    const line = raw.trim();

    if (line.startsWith('require (')) {
      inRequireBlock = true;
      continue;
    }
    if (inRequireBlock && line === ')') {
      inRequireBlock = false;
      continue;
    }

    if (inRequireBlock) {
      const match = line.match(/^(\S+)\s+(\S+)/);
      if (match) {
        result.push({
          name: match[1],
          version: match[2],
          type: 'production',
        });
      }
    }

    if (!inRequireBlock && line.startsWith('require ')) {
      const match = line.match(/^require\s+(\S+)\s+(\S+)/);
      if (match) {
        result.push({
          name: match[1],
          version: match[2],
          type: 'production',
        });
      }
    }
  }

  return result;
}

// ─── Cargo.toml (Rust) ───────────────────────────────────────────

export function extractCargoToml(content: string): ExtractedDependency[] {
  const result: ExtractedDependency[] = [];
  let currentSection: ExtractedDependency['type'] | null = null;

  for (const raw of content.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;

    const sectionMatch = line.match(/^\[(.+)]$/);
    if (sectionMatch) {
      const section = sectionMatch[1];
      if (section === 'dependencies') currentSection = 'production';
      else if (section === 'dev-dependencies') currentSection = 'dev';
      else if (section === 'build-dependencies') currentSection = 'dev';
      else currentSection = null;
      continue;
    }

    if (!currentSection) continue;

    // Simple: name = "version"
    const simpleMatch = line.match(/^([a-zA-Z0-9_-]+)\s*=\s*"([^"]+)"/);
    if (simpleMatch) {
      result.push({
        name: simpleMatch[1],
        version: simpleMatch[2],
        type: currentSection,
      });
      continue;
    }

    // Table inline: name = { version = "x", ... }
    const tableMatch = line.match(
      /^([a-zA-Z0-9_-]+)\s*=\s*\{.*version\s*=\s*"([^"]+)"/,
    );
    if (tableMatch) {
      result.push({
        name: tableMatch[1],
        version: tableMatch[2],
        type: currentSection,
      });
    }
  }

  return result;
}

// ─── pom.xml (Maven) ─────────────────────────────────────────────

export function extractPomXml(content: string): ExtractedDependency[] {
  const result: ExtractedDependency[] = [];
  const depRegex =
    /<dependency>\s*<groupId>([^<]+)<\/groupId>\s*<artifactId>([^<]+)<\/artifactId>(?:\s*<version>([^<]+)<\/version>)?(?:\s*<scope>([^<]+)<\/scope>)?/g;

  let match: RegExpExecArray | null;
  while ((match = depRegex.exec(content)) !== null) {
    const scope = match[4];
    let type: ExtractedDependency['type'] = 'production';
    if (scope === 'test' || scope === 'provided') type = 'dev';
    if (scope === 'optional') type = 'optional';

    result.push({
      name: `${match[1]}:${match[2]}`,
      version: match[3] || undefined,
      type,
    });
  }

  return result;
}

// ─── build.gradle / build.gradle.kts (Gradle) ───────────────────

export function extractBuildGradle(content: string): ExtractedDependency[] {
  const result: ExtractedDependency[] = [];

  // Matches: implementation 'group:artifact:version'
  // and:     implementation("group:artifact:version")
  const depRegex =
    /\b(implementation|api|compileOnly|runtimeOnly|testImplementation|testRuntimeOnly|annotationProcessor)\s*[('"]([^)'"]+)[)'"]/g;

  const devConfigs = new Set([
    'testImplementation',
    'testRuntimeOnly',
    'compileOnly',
    'annotationProcessor',
  ]);

  let match: RegExpExecArray | null;
  while ((match = depRegex.exec(content)) !== null) {
    const config = match[1];
    const dep = match[2].replace(/['"()]/g, '').trim();
    const parts = dep.split(':');

    if (parts.length >= 2) {
      result.push({
        name: `${parts[0]}:${parts[1]}`,
        version: parts[2] || undefined,
        type: devConfigs.has(config) ? 'dev' : 'production',
      });
    }
  }

  return result;
}

// ─── pubspec.yaml (Dart / Flutter) ───────────────────────────────

export function extractPubspecYaml(content: string): ExtractedDependency[] {
  const result: ExtractedDependency[] = [];
  let currentSection: ExtractedDependency['type'] | null = null;

  for (const raw of content.split('\n')) {
    if (raw.match(/^dependencies:\s*$/)) {
      currentSection = 'production';
      continue;
    }
    if (raw.match(/^dev_dependencies:\s*$/)) {
      currentSection = 'dev';
      continue;
    }
    // A new top-level key resets the section
    if (raw.match(/^\S/) && !raw.startsWith('#')) {
      currentSection = null;
      continue;
    }

    if (!currentSection) continue;

    // Indented dependency: "  package_name: ^1.0.0" or "  package_name:"
    const match = raw.match(/^\s{2}([a-zA-Z0-9_]+):\s*(.*)/);
    if (match) {
      const name = match[1];
      if (name === 'flutter' || name === 'flutter_test') continue;
      const version = match[2].trim() || undefined;
      result.push({ name, version, type: currentSection });
    }
  }

  return result;
}

// ─── Pipfile (Python / pipenv) ───────────────────────────────────

export function extractPipfile(content: string): ExtractedDependency[] {
  const result: ExtractedDependency[] = [];
  let currentSection: ExtractedDependency['type'] | null = null;

  for (const raw of content.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;

    if (line === '[packages]') {
      currentSection = 'production';
      continue;
    }
    if (line === '[dev-packages]') {
      currentSection = 'dev';
      continue;
    }
    if (line.startsWith('[')) {
      currentSection = null;
      continue;
    }

    if (!currentSection) continue;

    const match = line.match(/^([a-zA-Z0-9_.-]+)\s*=\s*"([^"]+)"/);
    if (match) {
      const version = match[2] === '*' ? undefined : match[2];
      result.push({ name: match[1], version, type: currentSection });
    }
  }

  return result;
}

// ─── pyproject.toml (Python / PEP 621 & Poetry) ─────────────────

export function extractPyprojectToml(content: string): ExtractedDependency[] {
  const result: ExtractedDependency[] = [];
  let currentSection: string | null = null;

  for (const raw of content.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;

    const sectionMatch = line.match(/^\[(.+)]$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1];
      continue;
    }

    // PEP 621: [project] → dependencies = [...]
    if (currentSection === 'project' && line.startsWith('dependencies')) {
      const inlineMatch = line.match(/dependencies\s*=\s*\[([^\]]*)\]/);
      if (inlineMatch) {
        parsePyDependencyList(inlineMatch[1], 'production', result);
      }
      continue;
    }

    // Poetry: [tool.poetry.dependencies]
    if (currentSection === 'tool.poetry.dependencies') {
      const match = line.match(/^([a-zA-Z0-9_.-]+)\s*=\s*"([^"]+)"/);
      if (match && match[1] !== 'python') {
        const version = match[2] === '*' ? undefined : match[2];
        result.push({ name: match[1], version, type: 'production' });
      }
    }

    // Poetry: [tool.poetry.dev-dependencies] or [tool.poetry.group.dev.dependencies]
    if (
      currentSection === 'tool.poetry.dev-dependencies' ||
      currentSection === 'tool.poetry.group.dev.dependencies'
    ) {
      const match = line.match(/^([a-zA-Z0-9_.-]+)\s*=\s*"([^"]+)"/);
      if (match) {
        const version = match[2] === '*' ? undefined : match[2];
        result.push({ name: match[1], version, type: 'dev' });
      }
    }
  }

  return result;
}

function parsePyDependencyList(
  listStr: string,
  type: ExtractedDependency['type'],
  result: ExtractedDependency[],
): void {
  const items = listStr.split(',').map((s) => s.trim().replace(/['"]/g, ''));
  for (const item of items) {
    if (!item) continue;
    const match = item.match(/^([a-zA-Z0-9_.-]+)\s*(.*)?$/);
    if (match) {
      result.push({
        name: match[1],
        version: match[2]?.trim() || undefined,
        type,
      });
    }
  }
}

// ─── Package.swift (Swift Package Manager) ───────────────────────

export function extractPackageSwift(content: string): ExtractedDependency[] {
  const result: ExtractedDependency[] = [];

  // Matches: .package(url: "https://github.com/owner/repo", from: "1.0.0")
  // and:     .package(url: "https://github.com/owner/repo.git", .upToNextMajor(from: "2.0.0"))
  const pkgRegex =
    /\.package\(\s*url:\s*"([^"]+)"[^)]*?(?:from:\s*"([^"]+)"|"([^"]+)"\s*\.\.\.\s*"([^"]+)")?/g;

  let match: RegExpExecArray | null;
  while ((match = pkgRegex.exec(content)) !== null) {
    const url = match[1];
    // Extract package name from URL
    const name = url
      .replace(/\.git$/, '')
      .split('/')
      .pop();
    if (!name) continue;
    result.push({
      name,
      version: match[2] || match[3] || undefined,
      type: 'production',
    });
  }

  return result;
}

// ─── Extractor registry ──────────────────────────────────────────

const EXTRACTOR_MAP: Record<string, DependencyExtractor> = {
  'package.json': extractPackageJson,
  'requirements.txt': extractRequirementsTxt,
  'composer.json': extractComposerJson,
  Gemfile: extractGemfile,
  'go.mod': extractGoMod,
  'Cargo.toml': extractCargoToml,
  'pom.xml': extractPomXml,
  'build.gradle': extractBuildGradle,
  'build.gradle.kts': extractBuildGradle,
  'pubspec.yaml': extractPubspecYaml,
  Pipfile: extractPipfile,
  'pyproject.toml': extractPyprojectToml,
  'Package.swift': extractPackageSwift,
};

export function getExtractor(fileName: string): DependencyExtractor | null {
  return EXTRACTOR_MAP[fileName] || null;
}

export function extractDependenciesFromFile(
  fileName: string,
  content: string,
): ExtractedDependency[] {
  const extractor = getExtractor(fileName);
  if (!extractor) return [];
  return extractor(content);
}

// ─── Project metadata extractors ──────────────────────────────────

function extractMetaPackageJson(content: string): ProjectMeta {
  const parsed = JSON.parse(content);
  return {
    version: typeof parsed.version === 'string' ? parsed.version : null,
    license: typeof parsed.license === 'string' ? parsed.license : null,
  };
}

function extractMetaCargoToml(content: string): ProjectMeta {
  const version =
    content.match(/^\[package\][\s\S]*?^version\s*=\s*"([^"]+)"/m)?.[1] ??
    null;
  const license =
    content.match(/^\[package\][\s\S]*?^license\s*=\s*"([^"]+)"/m)?.[1] ??
    null;
  return { version, license };
}

function extractMetaPyprojectToml(content: string): ProjectMeta {
  const version =
    content.match(/^version\s*=\s*"([^"]+)"/m)?.[1] ?? null;
  const license =
    content.match(/^license\s*=\s*"([^"]+)"/m)?.[1] ?? null;
  return { version, license };
}

function extractMetaPubspecYaml(content: string): ProjectMeta {
  const version = content.match(/^version:\s*(.+)/m)?.[1]?.trim() ?? null;
  return { version, license: null };
}

const META_EXTRACTOR_MAP: Record<string, MetaExtractor> = {
  'package.json': extractMetaPackageJson,
  'Cargo.toml': extractMetaCargoToml,
  'pyproject.toml': extractMetaPyprojectToml,
  'pubspec.yaml': extractMetaPubspecYaml,
};

export function extractProjectMeta(
  fileName: string,
  content: string,
): ProjectMeta | null {
  const extractor = META_EXTRACTOR_MAP[fileName];
  if (!extractor) return null;
  try {
    return extractor(content);
  } catch {
    return null;
  }
}
