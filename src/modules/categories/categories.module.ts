import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { AdminCategoriesController } from './admin-categories.controller';

@Module({
  controllers: [CategoriesController, AdminCategoriesController],
  providers: [CategoriesService],
})
export class CategoriesModule {}
