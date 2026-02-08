import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class AnalyzeUrlDto {
  @IsString()
  @IsNotEmpty()
  @Matches(
    /^https?:\/\/(github\.com|gitlab\.com|[\w.-]+)\/[\w.-]+\/[\w.-]+\/?.*$/,
    { message: 'url must be a valid GitHub or GitLab repository URL' },
  )
  url: string;
}
