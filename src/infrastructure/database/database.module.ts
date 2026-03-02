import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Ports
import { USER_REPOSITORY } from '@domain/ports/user.repository.interface';
import { CLIENT_REPOSITORY } from '@domain/ports/client.repository.interface';
import { NOTE_REPOSITORY } from '@domain/ports/note.repository.interface';
import { APPOINTMENT_REPOSITORY } from '@domain/ports/appointment.repository.interface';
import { ATTACHMENT_REPOSITORY } from '@domain/ports/attachment.repository.interface';
import { MESSAGE_TEMPLATE_REPOSITORY } from '@domain/ports/message-template.repository.interface';

// ORM Entities
import { UserOrmEntity } from './entities/user.orm-entity';
import { ClientOrmEntity } from './entities/client.orm-entity';
import { NoteOrmEntity } from './entities/note.orm-entity';
import { AppointmentOrmEntity } from './entities/appointment.orm-entity';
import { AttachmentOrmEntity } from './entities/attachment.orm-entity';
import { MessageTemplateOrmEntity } from './entities/message-template.orm-entity';

// Repositories
import { UserRepository } from './repositories/user.repository';
import { ClientRepository } from './repositories/client.repository';
import { NoteRepository } from './repositories/note.repository';
import { AppointmentRepository } from './repositories/appointment.repository';
import { AttachmentRepository } from './repositories/attachment.repository';
import { MessageTemplateRepository } from './repositories/message-template.repository';

// Combine Repositories Providers to bind Interfaces -> Implementations
const repositoryProviders = [
  {
    provide: USER_REPOSITORY,
    useClass: UserRepository,
  },
  {
    provide: CLIENT_REPOSITORY,
    useClass: ClientRepository,
  },
  {
    provide: NOTE_REPOSITORY,
    useClass: NoteRepository,
  },
  {
    provide: APPOINTMENT_REPOSITORY,
    useClass: AppointmentRepository,
  },
  {
    provide: ATTACHMENT_REPOSITORY,
    useClass: AttachmentRepository,
  },
  {
    provide: MESSAGE_TEMPLATE_REPOSITORY,
    useClass: MessageTemplateRepository,
  },
];

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserOrmEntity,
      ClientOrmEntity,
      NoteOrmEntity,
      AppointmentOrmEntity,
      AttachmentOrmEntity,
      MessageTemplateOrmEntity,
    ]),
  ],
  providers: [...repositoryProviders],
  exports: [...repositoryProviders, TypeOrmModule],
})
export class DatabaseModule {}
