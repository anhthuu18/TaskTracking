import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { UsersController } from './controllers/users.controller';
import { RolesController } from './controllers/roles.controller';
import { PermissionsController } from './controllers/permissions.controller';
import { UsersService } from './services/users.service';
import { RolesService } from './services/roles.service';
import { PermissionsService } from './services/permissions.service';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig],
    }),
    DatabaseModule,
  ],
  controllers: [UsersController, RolesController, PermissionsController],
  providers: [UsersService, RolesService, PermissionsService],
})
export class AppModule {}
