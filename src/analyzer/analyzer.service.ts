import { Injectable } from '@nestjs/common';
import {
  ExtractedDependency,
  extractDependenciesFromFile,
} from './dependency-extractors';

interface RepoFile {
  name: string;
  type: 'file' | 'dir';
  path: string;
  content?: string;
}

interface DependencyFile {
  file: string;
  path: string;
  packages: ExtractedDependency[];
}

export interface AnalysisResult {
  language: string;
  packageManager: string | null;
  dependencies: DependencyFile[];
  structure: {
    directories: string[];
    keyFiles: string[];
  };
}

const EXTENSION_LANGUAGE_MAP: Record<string, string> = {
  '.ts': 'TypeScript',
  '.tsx': 'TypeScript',
  '.js': 'JavaScript',
  '.jsx': 'JavaScript',
  '.py': 'Python',
  '.java': 'Java',
  '.go': 'Go',
  '.rb': 'Ruby',
  '.php': 'PHP',
  '.rs': 'Rust',
  '.cs': 'C#',
  '.cpp': 'C++',
  '.cc': 'C++',
  '.c': 'C',
  '.swift': 'Swift',
  '.kt': 'Kotlin',
  '.scala': 'Scala',
  '.dart': 'Dart',
  '.vue': 'Vue',
  '.svelte': 'Svelte',
};

const DEPENDENCY_FILES: Record<string, string> = {
  'package.json': 'npm',
  'yarn.lock': 'yarn',
  'pnpm-lock.yaml': 'pnpm',
  'requirements.txt': 'pip',
  Pipfile: 'pip',
  'pyproject.toml': 'pip',
  'composer.json': 'composer',
  Gemfile: 'bundler',
  'go.mod': 'go modules',
  'Cargo.toml': 'cargo',
  'pom.xml': 'maven',
  'build.gradle': 'gradle',
  'build.gradle.kts': 'gradle',
  'pubspec.yaml': 'pub',
  'Package.swift': 'swift package manager',
};

const KEY_DIRECTORIES = new Set([
  'src',
  'lib',
  'app',
  'components',
  'api',
  'test',
  'tests',
  'spec',
  'docs',
  'public',
  'static',
  'config',
  'utils',
  'helpers',
  'scripts',
  'assets',
  'styles',
  'pages',
  'routes',
  'middleware',
  'models',
  'views',
  'controllers',
  'services',
]);

const KEY_FILES = new Set([
  'README.md',
  'README',
  'LICENSE',
  'LICENSE.md',
  '.gitignore',
  'Dockerfile',
  'docker-compose.yml',
  'docker-compose.yaml',
  'Makefile',
  '.env.example',
  'tsconfig.json',
  '.eslintrc.js',
  '.prettierrc',
]);

@Injectable()
export class AnalyzerService {
  analyze(files: RepoFile[]): AnalysisResult {
    const language = this.detectLanguage(files);
    const dependencies = this.detectDependencies(files);
    const packageManager = this.getPackageManager(dependencies);
    const structure = this.detectStructure(files);

    return { language, packageManager, dependencies, structure };
  }

  private detectLanguage(files: RepoFile[]): string {
    const counts: Record<string, number> = {};

    for (const file of files) {
      if (file.type !== 'file') continue;

      const dotIndex = file.name.lastIndexOf('.');
      if (dotIndex === -1) continue;

      const ext = file.name.slice(dotIndex).toLowerCase();
      const language = EXTENSION_LANGUAGE_MAP[ext];
      if (language) {
        counts[language] = (counts[language] || 0) + 1;
      }
    }

    let maxCount = 0;
    let dominant = 'Unknown';

    for (const [lang, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        dominant = lang;
      }
    }

    return dominant;
  }

  private detectDependencies(files: RepoFile[]): DependencyFile[] {
    const found: DependencyFile[] = [];

    for (const file of files) {
      if (file.type !== 'file') continue;

      if (DEPENDENCY_FILES[file.name]) {
        const packages = file.content
          ? extractDependenciesFromFile(file.name, file.content)
          : [];
        found.push({ file: file.name, path: file.path, packages });
      }
    }

    return found;
  }

  private getPackageManager(dependencies: DependencyFile[]): string | null {
    // Lock files take priority as they're more specific
    const lockFilePriority = ['yarn.lock', 'pnpm-lock.yaml'];
    for (const lockFile of lockFilePriority) {
      const found = dependencies.find((d) => d.file === lockFile);
      if (found) return DEPENDENCY_FILES[lockFile];
    }

    // Fall back to the first dependency file found
    if (dependencies.length > 0) {
      return DEPENDENCY_FILES[dependencies[0].file] || null;
    }

    return null;
  }

  private detectStructure(files: RepoFile[]): {
    directories: string[];
    keyFiles: string[];
  } {
    const directories: string[] = [];
    const keyFiles: string[] = [];

    for (const file of files) {
      const baseName = file.name;

      if (file.type === 'dir' && KEY_DIRECTORIES.has(baseName)) {
        directories.push(file.path);
      }

      if (file.type === 'file' && KEY_FILES.has(baseName)) {
        keyFiles.push(file.path);
      }
    }

    return { directories, keyFiles };
  }
}
