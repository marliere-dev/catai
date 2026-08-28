import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { AuthGuard } from '../auth/auth.guard';
import { CurrentFirebaseUser } from '../auth/decorators/current-firebase-user.decorator';
import { RequireEmailVerified } from '../auth/decorators/require-email-verified.decorator';
import { FirebaseUser } from '../auth/auth.types';
import { UsersService } from '../users/users.service';
import { CollectionRequest } from './collection-request.entity';
import { CreateRequestDto } from './dto/create-request.dto';
import { ListAvailableRequestsQuery } from './dto/list-available-requests.query';
import { RequestImage } from './request-image.entity';
import { AvailableRequest } from './request.types';
import { RequestsService } from './requests.service';

@Controller('requests')
@UseGuards(AuthGuard)
@RequireEmailVerified()
export class RequestsController {
  constructor(
    private readonly requests: RequestsService,
    private readonly users: UsersService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @CurrentFirebaseUser() fb: FirebaseUser,
    @Body() dto: CreateRequestDto,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<CollectionRequest> {
    const user = await this.users.ensureFromFirebase(fb);
    return this.requests.create(user, dto, file);
  }

  @Get('my')
  async listMy(@CurrentFirebaseUser() fb: FirebaseUser): Promise<CollectionRequest[]> {
    const user = await this.users.ensureFromFirebase(fb);
    return this.requests.listMy(user);
  }

  @Get('available')
  async listAvailable(
    @CurrentFirebaseUser() fb: FirebaseUser,
    @Query() query: ListAvailableRequestsQuery,
  ): Promise<AvailableRequest[]> {
    const user = await this.users.ensureFromFirebase(fb);
    return this.requests.listAvailable(user, query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<CollectionRequest> {
    return this.requests.findOne(id);
  }

  @Post(':id/reserve')
  @HttpCode(HttpStatus.OK)
  async reserve(
    @CurrentFirebaseUser() fb: FirebaseUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CollectionRequest> {
    const user = await this.users.ensureFromFirebase(fb);
    return this.requests.reserve(user, id);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  async complete(
    @CurrentFirebaseUser() fb: FirebaseUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CollectionRequest> {
    const user = await this.users.ensureFromFirebase(fb);
    return this.requests.complete(user, id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(
    @CurrentFirebaseUser() fb: FirebaseUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CollectionRequest> {
    const user = await this.users.ensureFromFirebase(fb);
    return this.requests.cancel(user, id);
  }

  @Post(':id/image')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(
    @CurrentFirebaseUser() fb: FirebaseUser,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<RequestImage> {
    const user = await this.users.ensureFromFirebase(fb);
    if (!file) {
      throw new BadRequestException('image field is required');
    }
    return this.requests.attachImage(user, id, file);
  }

  @Delete(':id/image')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteImage(
    @CurrentFirebaseUser() fb: FirebaseUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    const user = await this.users.ensureFromFirebase(fb);
    await this.requests.removeImage(user, id);
  }
}
