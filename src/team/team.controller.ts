import { Controller, Get } from '@nestjs/common'
import { TeamService } from './team.service'

@Controller('team')
export class TeamController {
  constructor(private readonly team: TeamService) {}

  @Get()
  list() {
    return { status: 'success', data: this.team.listTeam() }
  }
}
