import { Module } from '@nestjs/common';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';
import { StockMovementService } from './stock-movement.service';
import { VariantesController } from './variantes.controller';

@Module({
  imports: [],
  controllers: [StockController, VariantesController],
  providers: [StockService, StockMovementService],
  exports: [StockMovementService, StockService],
})
export class StockModule {}
