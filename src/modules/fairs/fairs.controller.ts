import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'node:crypto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma/enums';
import { CreateFairDto } from './dto/create-fair.dto';
import { UpdateFairDto } from './dto/update-fair.dto';
import { FairsService } from './fairs.service';
import {
  getFlyerExtension,
  removeFlyerFile,
  validateFlyerFile,
} from './flyer-file';

@Controller('fairs')
export class FairsController {
  constructor(private readonly fairsService: FairsService) {}

  @Public()
  @Get()
  async findAll() {
    return this.fairsService.findAll();
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.fairsService.findOne(id);
  }

  @Roles(UserRole.ADMIN)
  @Post()
  async create(@Body() dto: CreateFairDto) {
    return this.fairsService.create(dto);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateFairDto) {
    return this.fairsService.update(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.fairsService.remove(id);
  }

  @Roles(UserRole.ADMIN)
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_request, file, callback) => {
          const extension = getFlyerExtension(file.mimetype);

          if (!extension) {
            callback(new Error('Tipo de archivo no permitido.'), '');
            return;
          }

          callback(null, `flyer-${randomUUID()}${extension}`);
        },
      }),
      fileFilter: (_request, file, callback) => {
        if (!getFlyerExtension(file.mimetype)) {
          callback(
            new BadRequestException(
              'Formato no permitido. Usá una imagen JPEG, PNG o WebP.',
            ),
            false,
          );
          return;
        }

        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async uploadFile(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Archivo no provisto o inválido.');
    }

    const hasValidSignature = await validateFlyerFile(file);
    if (!hasValidSignature) {
      await removeFlyerFile(file.path);
      throw new BadRequestException(
        'El contenido del archivo no coincide con una imagen válida.',
      );
    }

    return { url: `/uploads/${file.filename}` };
  }
}
