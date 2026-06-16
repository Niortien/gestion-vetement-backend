import { Module } from '@nestjs/common';
import { EntreesController } from './entrees.controller';
import { EntreesService } from './entrees.service';
import { StockModule } from '../stock/stock.module';

@Module({
  imports: [StockModule],
  controllers: [EntreesController],
  providers: [EntreesService],
  exports: [EntreesService],
})
export class EntreesModule {}
