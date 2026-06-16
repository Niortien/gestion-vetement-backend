import { Module } from '@nestjs/common';
import { CaisseController } from './caisse.controller';
import { CaisseService } from './caisse.service';
import { CaisseGateway } from './caisse-gateway';

@Module({
  controllers: [CaisseController],
  providers: [CaisseService, CaisseGateway],
  exports: [CaisseService],
})
export class CaisseModule {}
