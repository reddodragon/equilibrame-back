import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { FairsController } from './fairs.controller';
import { FairsService } from './fairs.service';

@Module({
  imports: [PrismaModule],
  controllers: [FairsController],
  providers: [FairsService],
  exports: [FairsService],
})
export class FairsModule {}
