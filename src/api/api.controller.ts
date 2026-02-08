import { Body, Controller, Post, BadRequestException } from '@nestjs/common';
import { RepositoryService } from '../repository/repository.service';
import { AnalyzerService, AnalysisResult } from '../analyzer/analyzer.service';
import {
  GeneratorService,
  GenerateReadmeInput,
} from '../generator/generator.service';
import { AnalyzeUrlDto } from './dto/analyze-url.dto';
import { GenerateReadmeUrlDto } from './dto/generate-readme-url.dto';
import { RepoInfo } from '../repository/repository.service';

@Controller('api')
export class ApiController {
  constructor(
    private readonly repositoryService: RepositoryService,
    private readonly analyzerService: AnalyzerService,
    private readonly generatorService: GeneratorService,
  ) {}

  @Post('analyze')
  async analyze(@Body() dto: AnalyzeUrlDto) {
    const repoInfo = await this.repositoryService.getRepoInfo(dto.url);
    const analysisResult = this.analyzerService.analyze(repoInfo.files);

    return { repoInfo, analysisResult };
  }

  @Post('generate-readme')
  async generateReadme(@Body() dto: GenerateReadmeUrlDto) {
    let repoInfo: RepoInfo;
    let analysisResult: AnalysisResult;

    if (dto.url) {
      repoInfo = await this.repositoryService.getRepoInfo(dto.url);
      analysisResult = this.analyzerService.analyze(repoInfo.files);
    } else if (dto.repoInfo && dto.analysisResult) {
      repoInfo = dto.repoInfo as RepoInfo;
      analysisResult = dto.analysisResult as AnalysisResult;
    } else {
      throw new BadRequestException(
        'Provide either "url" or both "repoInfo" and "analysisResult"',
      );
    }

    const input: GenerateReadmeInput = { repoInfo, analysisResult };
    const readme = this.generatorService.generate(input);

    return { readme };
  }
}
