import { Injectable } from '@nestjs/common';

interface RepoInfo {
  name: string;
  description: string | null;
  language: string | null;
  platform: 'github' | 'gitlab';
  owner: string;
}

interface DependencyFile {
  file: string;
  path: string;
  packages: { name: string; version?: string; type: string }[];
}

interface AnalysisResult {
  language: string;
  packageManager: string | null;
  dependencies: DependencyFile[];
  structure: {
    directories: string[];
    keyFiles: string[];
  };
  version?: string | null;
  license?: string | null;
}

export interface GenerateReadmeInput {
  repoInfo: RepoInfo;
  analysisResult: AnalysisResult;
}

const LANGUAGE_BADGES: Record<string, { color: string; logo: string; logoColor?: string }> = {
  TypeScript:  { color: '3178C6', logo: 'typescript', logoColor: 'white' },
  JavaScript:  { color: 'F7DF1E', logo: 'javascript', logoColor: 'black' },
  Python:      { color: '3776AB', logo: 'python', logoColor: 'white' },
  Java:        { color: 'ED8B00', logo: 'openjdk', logoColor: 'white' },
  Go:          { color: '00ADD8', logo: 'go', logoColor: 'white' },
  Ruby:        { color: 'CC342D', logo: 'ruby', logoColor: 'white' },
  PHP:         { color: '777BB4', logo: 'php', logoColor: 'white' },
  Rust:        { color: '000000', logo: 'rust', logoColor: 'white' },
  'C#':        { color: '239120', logo: 'csharp', logoColor: 'white' },
  'C++':       { color: '00599C', logo: 'cplusplus', logoColor: 'white' },
  C:           { color: 'A8B9CC', logo: 'c', logoColor: 'black' },
  Swift:       { color: 'F05138', logo: 'swift', logoColor: 'white' },
  Kotlin:      { color: '7F52FF', logo: 'kotlin', logoColor: 'white' },
  Scala:       { color: 'DC322F', logo: 'scala', logoColor: 'white' },
  Dart:        { color: '0175C2', logo: 'dart', logoColor: 'white' },
  Vue:         { color: '4FC08D', logo: 'vuedotjs', logoColor: 'white' },
  Svelte:      { color: 'FF3E00', logo: 'svelte', logoColor: 'white' },
};

const INSTALL_COMMANDS: Record<string, { install: string; dev: string }> = {
  npm: { install: 'npm install', dev: 'npm run dev' },
  yarn: { install: 'yarn install', dev: 'yarn dev' },
  pnpm: { install: 'pnpm install', dev: 'pnpm dev' },
  pip: { install: 'pip install -r requirements.txt', dev: 'python main.py' },
  composer: { install: 'composer install', dev: 'php artisan serve' },
  bundler: { install: 'bundle install', dev: 'bundle exec rails server' },
  'go modules': { install: 'go mod download', dev: 'go run .' },
  cargo: { install: 'cargo build', dev: 'cargo run' },
  maven: { install: 'mvn install', dev: 'mvn spring-boot:run' },
  gradle: { install: './gradlew build', dev: './gradlew bootRun' },
  pub: { install: 'dart pub get', dev: 'dart run' },
  'swift package manager': {
    install: 'swift package resolve',
    dev: 'swift run',
  },
};

@Injectable()
export class GeneratorService {
  generate(input: GenerateReadmeInput): string {
    const { repoInfo, analysisResult } = input;

    const sections = [
      this.buildTitle(repoInfo),
      this.buildBadges(analysisResult),
      this.buildDescription(repoInfo),
      this.buildTableOfContents(),
      this.buildPrerequisites(analysisResult),
      this.buildInstallation(repoInfo, analysisResult),
      this.buildUsage(analysisResult),
      this.buildProjectStructure(analysisResult),
      this.buildDependencies(analysisResult),
      this.buildLicense(),
    ];

    return sections.filter(Boolean).join('\n\n');
  }

  private buildTitle(repoInfo: RepoInfo): string {
    return `# ${repoInfo.name}`;
  }

  private buildBadges(analysis: AnalysisResult): string {
    const badges: string[] = [];

    // Language badge
    const langBadge = LANGUAGE_BADGES[analysis.language];
    if (langBadge) {
      const logoColor = langBadge.logoColor ?? 'white';
      badges.push(
        `![${analysis.language}](https://img.shields.io/badge/${encodeURIComponent(analysis.language)}-${langBadge.color}?logo=${langBadge.logo}&logoColor=${logoColor})`,
      );
    }

    // License badge
    if (analysis.license) {
      badges.push(
        `![License](https://img.shields.io/badge/license-${encodeURIComponent(analysis.license)}-blue.svg)`,
      );
    }

    // Version badge
    if (analysis.version) {
      badges.push(
        `![Version](https://img.shields.io/badge/version-${encodeURIComponent(analysis.version)}-green.svg)`,
      );
    }

    return badges.length > 0 ? badges.join(' ') : '';
  }

  private buildDescription(repoInfo: RepoInfo): string {
    const description =
      repoInfo.description || 'A project built with modern technologies.';
    return description;
  }

  private buildTableOfContents(): string {
    return [
      '## Table of Contents',
      '',
      '- [Prerequisites](#prerequisites)',
      '- [Installation](#installation)',
      '- [Usage](#usage)',
      '- [Project Structure](#project-structure)',
      '- [Dependencies](#dependencies)',
      '- [License](#license)',
    ].join('\n');
  }

  private buildPrerequisites(analysis: AnalysisResult): string {
    const lines = ['## Prerequisites', '', 'Make sure you have installed:'];
    const runtime = this.getRuntimeForLanguage(analysis.language);

    if (runtime) {
      lines.push(`- ${runtime}`);
    }

    if (analysis.packageManager) {
      const pm = analysis.packageManager;
      if (!runtime || !runtime.toLowerCase().includes(pm.toLowerCase())) {
        lines.push(`- ${pm}`);
      }
    }

    lines.push('- Git');

    return lines.join('\n');
  }

  private buildInstallation(
    repoInfo: RepoInfo,
    analysis: AnalysisResult,
  ): string {
    const pm = analysis.packageManager;
    const commands = pm ? INSTALL_COMMANDS[pm] : null;

    const repoUrl =
      repoInfo.platform === 'github'
        ? `https://github.com/${repoInfo.owner}/${repoInfo.name}.git`
        : `https://gitlab.com/${repoInfo.owner}/${repoInfo.name}.git`;

    const lines = [
      '## Installation',
      '',
      '1. Clone the repository:',
      '',
      '```bash',
      `git clone ${repoUrl}`,
      `cd ${repoInfo.name}`,
      '```',
    ];

    if (commands) {
      lines.push(
        '',
        '2. Install dependencies:',
        '',
        '```bash',
        commands.install,
        '```',
      );
    }

    return lines.join('\n');
  }

  private buildUsage(analysis: AnalysisResult): string {
    const pm = analysis.packageManager;
    const commands = pm ? INSTALL_COMMANDS[pm] : null;

    const lines = ['## Usage'];

    if (commands) {
      lines.push(
        '',
        'Start the development server:',
        '',
        '```bash',
        commands.dev,
        '```',
      );
    } else {
      const example = this.getGenericRunExample(analysis.language);
      lines.push('', example);
    }

    return lines.join('\n');
  }

  private buildProjectStructure(analysis: AnalysisResult): string {
    if (analysis.structure.directories.length === 0) {
      return '';
    }

    const lines = ['## Project Structure', '', '```'];

    for (const dir of analysis.structure.directories) {
      lines.push(`├── ${dir}/`);
    }

    for (const file of analysis.structure.keyFiles) {
      lines.push(`├── ${file}`);
    }

    lines.push('```');

    return lines.join('\n');
  }

  private buildDependencies(analysis: AnalysisResult): string {
    const prodDeps = analysis.dependencies.flatMap((d) =>
      d.packages.filter((p) => p.type === 'production'),
    );
    const devDeps = analysis.dependencies.flatMap((d) =>
      d.packages.filter((p) => p.type === 'dev'),
    );

    if (prodDeps.length === 0 && devDeps.length === 0) {
      return '';
    }

    const lines = ['## Dependencies'];

    if (prodDeps.length > 0) {
      lines.push('', '### Main', '');
      lines.push('| Package | Version |', '|---------|---------|');
      for (const dep of prodDeps) {
        lines.push(`| ${dep.name} | ${dep.version || '-'} |`);
      }
    }

    if (devDeps.length > 0) {
      lines.push('', '### Development', '');
      lines.push('| Package | Version |', '|---------|---------|');
      for (const dep of devDeps) {
        lines.push(`| ${dep.name} | ${dep.version || '-'} |`);
      }
    }

    return lines.join('\n');
  }

  private buildLicense(): string {
    return [
      '## License',
      '',
      'This project is licensed under the terms specified in the LICENSE file.',
    ].join('\n');
  }

  private getRuntimeForLanguage(language: string): string | null {
    const runtimes: Record<string, string> = {
      TypeScript: 'Node.js (>= 18)',
      JavaScript: 'Node.js (>= 18)',
      Python: 'Python (>= 3.8)',
      Java: 'Java JDK (>= 17)',
      Go: 'Go (>= 1.21)',
      Ruby: 'Ruby (>= 3.0)',
      PHP: 'PHP (>= 8.1)',
      Rust: 'Rust (latest stable)',
      'C#': '.NET SDK (>= 8.0)',
      'C++': 'C++ compiler (GCC/Clang)',
      C: 'C compiler (GCC/Clang)',
      Swift: 'Swift (>= 5.9)',
      Kotlin: 'Kotlin / JDK (>= 17)',
      Scala: 'Scala / JDK (>= 17)',
      Dart: 'Dart SDK (>= 3.0)',
    };
    return runtimes[language] || null;
  }

  private getGenericRunExample(language: string): string {
    const examples: Record<string, string> = {
      TypeScript: '```bash\nnpx ts-node src/index.ts\n```',
      JavaScript: '```bash\nnode src/index.js\n```',
      Python: '```bash\npython main.py\n```',
      Java: '```bash\njavac Main.java && java Main\n```',
      Go: '```bash\ngo run .\n```',
      Ruby: '```bash\nruby main.rb\n```',
      PHP: '```bash\nphp index.php\n```',
      Rust: '```bash\ncargo run\n```',
      'C#': '```bash\ndotnet run\n```',
      Swift: '```bash\nswift run\n```',
      Dart: '```bash\ndart run\n```',
    };
    return (
      examples[language] ||
      'Refer to the project documentation for run instructions.'
    );
  }
}
