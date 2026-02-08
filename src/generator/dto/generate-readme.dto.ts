import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsIn,
} from 'class-validator';

class DependencyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  version?: string;

  @IsString()
  @IsIn(['production', 'dev', 'peer', 'optional'])
  type: 'production' | 'dev' | 'peer' | 'optional';
}

class DependencyFileDto {
  @IsString()
  @IsNotEmpty()
  file: string;

  @IsString()
  @IsNotEmpty()
  path: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DependencyDto)
  packages: DependencyDto[];
}

class StructureDto {
  @IsArray()
  @IsString({ each: true })
  directories: string[];

  @IsArray()
  @IsString({ each: true })
  keyFiles: string[];
}

class AnalysisResultDto {
  @IsString()
  @IsNotEmpty()
  language: string;

  @IsString()
  @IsOptional()
  packageManager: string | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DependencyFileDto)
  dependencies: DependencyFileDto[];

  @ValidateNested()
  @Type(() => StructureDto)
  structure: StructureDto;

  @IsString()
  @IsOptional()
  version?: string | null;

  @IsString()
  @IsOptional()
  license?: string | null;
}

class RepoInfoDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description: string | null;

  @IsString()
  @IsOptional()
  language: string | null;

  @IsString()
  @IsIn(['github', 'gitlab'])
  platform: 'github' | 'gitlab';

  @IsString()
  @IsNotEmpty()
  owner: string;
}

export class GenerateReadmeDto {
  @ValidateNested()
  @Type(() => RepoInfoDto)
  repoInfo: RepoInfoDto;

  @ValidateNested()
  @Type(() => AnalysisResultDto)
  analysisResult: AnalysisResultDto;
}
