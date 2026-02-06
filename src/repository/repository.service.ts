import {
  BadRequestException,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface ParsedRepo {
  platform: 'github' | 'gitlab';
  owner: string;
  repo: string;
}

interface RepoFile {
  name: string;
  type: 'file' | 'dir';
  path: string;
}

export interface RepoInfo {
  name: string;
  description: string | null;
  language: string | null;
  platform: 'github' | 'gitlab';
  owner: string;
  files: RepoFile[];
}

@Injectable()
export class RepositoryService {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  getGithubToken(): string | undefined {
    return this.configService.get<string>('GITHUB_TOKEN');
  }

  getGitlabToken(): string | undefined {
    return this.configService.get<string>('GITLAB_TOKEN');
  }

  getGitlabUrl(): string {
    return this.configService.get<string>('GITLAB_URL') || 'https://gitlab.com';
  }

  parseRepoUrl(url: string): ParsedRepo {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new BadRequestException('Invalid URL format');
    }

    const segments = parsed.pathname
      .replace(/\.git$/, '')
      .split('/')
      .filter(Boolean);

    if (segments.length < 2) {
      throw new BadRequestException(
        'URL must contain owner and repository name (e.g. https://github.com/owner/repo)',
      );
    }

    const owner = segments[0];
    const repo = segments[1];

    let platform: 'github' | 'gitlab';
    if (parsed.hostname === 'github.com') {
      platform = 'github';
    } else if (
      parsed.hostname === 'gitlab.com' ||
      parsed.hostname === new URL(this.getGitlabUrl()).hostname
    ) {
      platform = 'gitlab';
    } else {
      throw new BadRequestException(
        `Unsupported platform: ${parsed.hostname}. Only GitHub and GitLab are supported.`,
      );
    }

    return { platform, owner, repo };
  }

  async getRepoInfo(url: string): Promise<RepoInfo> {
    const { platform, owner, repo } = this.parseRepoUrl(url);

    if (platform === 'github') {
      return this.fetchGithubRepo(owner, repo);
    }
    return this.fetchGitlabRepo(owner, repo);
  }

  private async fetchGithubRepo(
    owner: string,
    repo: string,
  ): Promise<RepoInfo> {
    const token = this.getGithubToken();
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'devflow-ia-api',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const [repoResponse, contentsResponse] = await Promise.all([
        firstValueFrom(
          this.httpService.get(
            `https://api.github.com/repos/${owner}/${repo}`,
            { headers },
          ),
        ),
        firstValueFrom(
          this.httpService.get(
            `https://api.github.com/repos/${owner}/${repo}/contents`,
            { headers },
          ),
        ),
      ]);

      const repoData = repoResponse.data;
      const contents = contentsResponse.data;

      return {
        name: repoData.name,
        description: repoData.description,
        language: repoData.language,
        platform: 'github',
        owner,
        files: contents.map(
          (item: { name: string; type: string; path: string }) => ({
            name: item.name,
            type: item.type === 'dir' ? 'dir' : 'file',
            path: item.path,
          }),
        ),
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new HttpException(
          `Repository not found: ${owner}/${repo}`,
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException(
        `Failed to fetch GitHub repository: ${error.message}`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async fetchGitlabRepo(
    owner: string,
    repo: string,
  ): Promise<RepoInfo> {
    const token = this.getGitlabToken();
    const baseUrl = this.getGitlabUrl();
    const projectId = encodeURIComponent(`${owner}/${repo}`);
    const headers: Record<string, string> = {};
    if (token) {
      headers['PRIVATE-TOKEN'] = token;
    }

    try {
      const [repoResponse, treeResponse] = await Promise.all([
        firstValueFrom(
          this.httpService.get(`${baseUrl}/api/v4/projects/${projectId}`, {
            headers,
          }),
        ),
        firstValueFrom(
          this.httpService.get(
            `${baseUrl}/api/v4/projects/${projectId}/repository/tree`,
            { headers },
          ),
        ),
      ]);

      const repoData = repoResponse.data;
      const tree = treeResponse.data;

      return {
        name: repoData.name,
        description: repoData.description,
        language: null,
        platform: 'gitlab',
        owner,
        files: tree.map(
          (item: { name: string; type: string; path: string }) => ({
            name: item.name,
            type: item.type === 'tree' ? 'dir' : 'file',
            path: item.path,
          }),
        ),
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new HttpException(
          `Repository not found: ${owner}/${repo}`,
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException(
        `Failed to fetch GitLab repository: ${error.message}`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
