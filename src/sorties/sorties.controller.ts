import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
import { CreateSortieDto } from './dto/create-sortie.dto';
import { QuerySortieDto } from './dto/query-sortie.dto';
import { UpdateSortieDto } from './dto/update-sortie.dto';
import { SortiesService } from './sorties.service';

@ApiTags('Sorties')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sorties')
export class SortiesController {
  constructor(private readonly sortiesService: SortiesService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les sorties' })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'dateDebut', required: false })
  @ApiQuery({ name: 'dateFin', required: false })
  @ApiResponse({ status: 200 })
  async findAll(@Query() query: QuerySortieDto) {
    return this.sortiesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Recuperer une sortie' })
  @ApiResponse({ status: 200 })
  async findById(@Param('id') id: string) {
    return this.sortiesService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Creer une sortie + mouvements SORTIE atomiques' })
  @ApiResponse({ status: 201 })
  async create(
    @Body() dto: CreateSortieDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.sortiesService.create(dto, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier les notes d une sortie' })
  @ApiResponse({ status: 200 })
  async update(@Param('id') id: string, @Body() dto: UpdateSortieDto) {
    return this.sortiesService.update(id, dto);
  }

  @Patch(':id/annuler')
  @ApiOperation({ summary: 'Annuler une sortie' })
  @ApiResponse({ status: 200 })
  async annuler(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.sortiesService.annuler(id, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une sortie et inverser les mouvements de stock' })
  @ApiResponse({ status: 200 })
  async delete(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.sortiesService.delete(id, user.id);
  }
}
