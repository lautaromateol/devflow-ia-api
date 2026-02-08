import { GeneratorService, GenerateReadmeInput } from './generator.service';

describe('GeneratorService', () => {
  let service: GeneratorService;

  beforeEach(() => {
    service = new GeneratorService();
  });

  function makeInput(overrides: Partial<GenerateReadmeInput> = {}): GenerateReadmeInput {
    return {
      repoInfo: {
        name: 'test-project',
        description: 'A test project',
        language: 'TypeScript',
        platform: 'github',
        owner: 'testuser',
      },
      analysisResult: {
        language: 'TypeScript',
        packageManager: 'npm',
        dependencies: [],
        structure: { directories: ['src'], keyFiles: [] },
        version: null,
        license: null,
      },
      ...overrides,
    };
  }

  describe('badges', () => {
    it('should generate a language badge for TypeScript', () => {
      const result = service.generate(makeInput());
      expect(result).toContain(
        '![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)',
      );
    });

    it('should generate a language badge for JavaScript with black logoColor', () => {
      const input = makeInput({
        analysisResult: {
          language: 'JavaScript',
          packageManager: 'npm',
          dependencies: [],
          structure: { directories: [], keyFiles: [] },
          version: null,
          license: null,
        },
      });
      const result = service.generate(input);
      expect(result).toContain(
        '![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)',
      );
    });

    it('should generate a license badge when license is provided', () => {
      const input = makeInput({
        analysisResult: {
          language: 'TypeScript',
          packageManager: 'npm',
          dependencies: [],
          structure: { directories: [], keyFiles: [] },
          version: null,
          license: 'MIT',
        },
      });
      const result = service.generate(input);
      expect(result).toContain(
        '![License](https://img.shields.io/badge/license-MIT-blue.svg)',
      );
    });

    it('should generate a version badge when version is provided', () => {
      const input = makeInput({
        analysisResult: {
          language: 'TypeScript',
          packageManager: 'npm',
          dependencies: [],
          structure: { directories: [], keyFiles: [] },
          version: '1.2.3',
          license: null,
        },
      });
      const result = service.generate(input);
      expect(result).toContain(
        '![Version](https://img.shields.io/badge/version-1.2.3-green.svg)',
      );
    });

    it('should not include license badge when license is null', () => {
      const result = service.generate(makeInput());
      expect(result).not.toContain('![License]');
    });

    it('should not include version badge when version is null', () => {
      const result = service.generate(makeInput());
      expect(result).not.toContain('![Version]');
    });

    it('should generate all three badges when all data is available', () => {
      const input = makeInput({
        analysisResult: {
          language: 'Python',
          packageManager: 'pip',
          dependencies: [],
          structure: { directories: [], keyFiles: [] },
          version: '0.5.0',
          license: 'Apache-2.0',
        },
      });
      const result = service.generate(input);
      expect(result).toContain('![Python]');
      expect(result).toContain('![License]');
      expect(result).toContain('![Version]');
    });

    it('should place badges after the title', () => {
      const input = makeInput({
        analysisResult: {
          language: 'TypeScript',
          packageManager: 'npm',
          dependencies: [],
          structure: { directories: [], keyFiles: [] },
          version: '1.0.0',
          license: 'MIT',
        },
      });
      const result = service.generate(input);
      const titleIndex = result.indexOf('# test-project');
      const badgeIndex = result.indexOf('![TypeScript]');
      const descIndex = result.indexOf('A test project');
      expect(titleIndex).toBeLessThan(badgeIndex);
      expect(badgeIndex).toBeLessThan(descIndex);
    });

    it('should not produce empty badge line for unknown language without license or version', () => {
      const input = makeInput({
        analysisResult: {
          language: 'Unknown',
          packageManager: null,
          dependencies: [],
          structure: { directories: [], keyFiles: [] },
          version: null,
          license: null,
        },
      });
      const result = service.generate(input);
      expect(result).not.toContain('img.shields.io');
    });

    it('should encode special characters in badge labels', () => {
      const input = makeInput({
        analysisResult: {
          language: 'C#',
          packageManager: null,
          dependencies: [],
          structure: { directories: [], keyFiles: [] },
          version: null,
          license: null,
        },
      });
      const result = service.generate(input);
      expect(result).toContain('C%23');
      expect(result).toContain('logo=csharp');
    });
  });
});
