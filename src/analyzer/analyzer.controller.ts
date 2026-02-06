import { Body, Controller, Post } from '@nestjs/common';
import { AnalyzerService } from './analyzer.service';
import type { AnalysisResult } from './analyzer.service';
import { AnalyzeRepoDto } from './dto/analyze-repo.dto';

@Controller('analyzer')
export class AnalyzerController {
  constructor(private readonly analyzerService: AnalyzerService) {}

  @Post('analyze')
  analyze(@Body() analyzeRepoDto: AnalyzeRepoDto): AnalysisResult {
    return this.analyzerService.analyze(analyzeRepoDto.files);
  }
}
