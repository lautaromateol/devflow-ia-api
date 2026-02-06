import { Body, Controller, Post } from '@nestjs/common';
import { GeneratorService } from './generator.service';
import { GenerateReadmeDto } from './dto/generate-readme.dto';

@Controller('generator')
export class GeneratorController {
  constructor(private readonly generatorService: GeneratorService) {}

  @Post('readme')
  generateReadme(@Body() dto: GenerateReadmeDto): { readme: string } {
    const readme = this.generatorService.generate(dto);
    return { readme };
  }
}
