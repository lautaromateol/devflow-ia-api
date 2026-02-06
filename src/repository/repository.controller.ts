import { Body, Controller, Post } from '@nestjs/common';
import { RepositoryService, RepoInfo } from './repository.service';
import { FetchRepoDto } from './dto/fetch-repo.dto';

@Controller('repository')
export class RepositoryController {
  constructor(private readonly repositoryService: RepositoryService) {}

  @Post('info')
  async getRepoInfo(@Body() fetchRepoDto: FetchRepoDto): Promise<RepoInfo> {
    return this.repositoryService.getRepoInfo(fetchRepoDto.url);
  }
}
