import { Module } from '@nestjs/common';
import { ApiController } from './api.controller';
import { RepositoryModule } from '../repository/repository.module';
import { AnalyzerModule } from '../analyzer/analyzer.module';
import { GeneratorModule } from '../generator/generator.module';

@Module({
  imports: [RepositoryModule, AnalyzerModule, GeneratorModule],
  controllers: [ApiController],
})
export class ApiModule {}
