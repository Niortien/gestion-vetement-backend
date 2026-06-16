import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CaisseService } from './caisse.service';
import { CloseCaisseDto } from './dto/close-caisse.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import {
  OpenSessionDto,
  QueryTransactionDto,
} from './dto/query-transaction.dto';

@ApiTags('Caisse')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('caisse')
export class CaisseController {
  constructor(private readonly caisseService: CaisseService) {}

  @Get('sessions')
  @ApiOperation({ summary: 'Lister les sessions de caisse' })
  @ApiResponse({ status: 200 })
  async listSessions(@Query() query: QueryTransactionDto) {
    return this.caisseService.listSessions(query);
  }

  @Get('sessions/active')
  @ApiOperation({ summary: 'Recuperer la session ouverte du jour' })
  @ApiResponse({ status: 200 })
  async getActiveSession() {
    return this.caisseService.getActiveSession();
  }

  @Post('sessions/ouvrir')
  @ApiOperation({ summary: 'Ouvrir une session de caisse' })
  @ApiResponse({ status: 201 })
  async openSession(
    @Body() dto: OpenSessionDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.caisseService.openSession(dto, user.id);
  }

  @Post('sessions/:id/fermer')
  @ApiOperation({ summary: 'Fermer une session de caisse' })
  @ApiResponse({ status: 201 })
  async closeSession(@Param('id') id: string, @Body() dto: CloseCaisseDto) {
    return this.caisseService.closeSession(id, dto);
  }

  @Get('sessions/:id/transactions')
  @ApiOperation({ summary: 'Lister les transactions d une session' })
  @ApiQuery({ name: 'modePaiement', required: false })
  @ApiQuery({ name: 'dateDebut', required: false })
  @ApiQuery({ name: 'dateFin', required: false })
  @ApiResponse({ status: 200 })
  async listTransactions(
    @Param('id') id: string,
    @Query() query: QueryTransactionDto,
  ) {
    return this.caisseService.listTransactions(id, query);
  }

  @Post('transactions')
  @ApiOperation({ summary: 'Creer une transaction sur la session active' })
  @ApiResponse({ status: 201 })
  async createTransaction(@Body() dto: CreateTransactionDto) {
    return this.caisseService.createTransaction(dto);
  }

  @Get('resume-jour')
  @ApiOperation({ summary: 'Afficher le resume du jour' })
  @ApiResponse({ status: 200 })
  async resumeJour() {
    return this.caisseService.resumeJour();
  }
}
