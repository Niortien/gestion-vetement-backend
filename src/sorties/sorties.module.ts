import { Module } from '@nestjs/common';
import { SortiesController } from './sorties.controller';
import { SortiesService } from './sorties.service';
import { StockModule } from '../stock/stock.module';

@Module({
  imports: [StockModule],
  controllers: [SortiesController],
  providers: [SortiesService],
  exports: [SortiesService],
})
export class SortiesModule {}
