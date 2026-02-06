import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class RepoFileDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsIn(['file', 'dir'])
  type: 'file' | 'dir';

  @IsString()
  @IsNotEmpty()
  path: string;

  @IsString()
  @IsOptional()
  content?: string;
}

export class AnalyzeRepoDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => RepoFileDto)
  files: RepoFileDto[];
}
