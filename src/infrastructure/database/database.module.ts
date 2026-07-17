import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Ports
import { COMPANY_REPOSITORY } from '@domain/ports/company.repository.interface';
import { USER_REPOSITORY } from '@domain/ports/user.repository.interface';
import { CLIENT_REPOSITORY } from '@domain/ports/client.repository.interface';
import { NOTE_REPOSITORY } from '@domain/ports/note.repository.interface';
import { APPOINTMENT_REPOSITORY } from '@domain/ports/appointment.repository.interface';
import { ATTACHMENT_REPOSITORY } from '@domain/ports/attachment.repository.interface';
import { MESSAGE_TEMPLATE_REPOSITORY } from '@domain/ports/message-template.repository.interface';
import { PRODUCT_REPOSITORY } from '@domain/ports/product.repository.interface';
import { CLIENT_PRODUCT_REPOSITORY } from '@domain/ports/client-product.repository.interface';
import { PAYMENT_REPOSITORY } from '@domain/ports/payment.repository.interface';
import { GOOGLE_INTEGRATION_REPOSITORY } from '@domain/ports/google-integration.repository.interface';

// ORM Entities
import { CompanyOrmEntity } from './entities/company.orm-entity';
import { UserOrmEntity } from './entities/user.orm-entity';
import { ClientOrmEntity } from './entities/client.orm-entity';
import { NoteOrmEntity } from './entities/note.orm-entity';
import { AppointmentOrmEntity } from './entities/appointment.orm-entity';
import { AttachmentOrmEntity } from './entities/attachment.orm-entity';
import { MessageTemplateOrmEntity } from './entities/message-template.orm-entity';
import { ProductOrmEntity } from './entities/product.orm-entity';
import { ClientProductOrmEntity } from './entities/client-product.orm-entity';
import { StageOrmEntity } from './entities/stage.orm-entity';
import { PaymentOrmEntity } from './entities/payment.orm-entity';
import { GoogleIntegrationOrmEntity } from './entities/google-integration.orm-entity';
import { GoogleOAuthStateOrmEntity } from './entities/google-oauth-state.orm-entity';

// Repositories
import { CompanyRepository } from './repositories/company.repository';
import { UserRepository } from './repositories/user.repository';
import { ClientRepository } from './repositories/client.repository';
import { NoteRepository } from './repositories/note.repository';
import { AppointmentRepository } from './repositories/appointment.repository';
import { AttachmentRepository } from './repositories/attachment.repository';
import { MessageTemplateRepository } from './repositories/message-template.repository';
import { ProductRepository } from './repositories/product.repository';
import { ClientProductRepository } from './repositories/client-product.repository';
import { StageSeedService } from './stage-seed.service';
import { PaymentRepository } from './repositories/payment.repository';
import { GoogleIntegrationRepository } from './repositories/google-integration.repository';

// Combine Repositories Providers to bind Interfaces -> Implementations
const repositoryProviders = [
  {
    provide: COMPANY_REPOSITORY,
    useClass: CompanyRepository,
  },
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
  {
    provide: PRODUCT_REPOSITORY,
    useClass: ProductRepository,
  },
  {
    provide: CLIENT_PRODUCT_REPOSITORY,
    useClass: ClientProductRepository,
  },
  {
    provide: PAYMENT_REPOSITORY,
    useClass: PaymentRepository,
  },
  {
    provide: GOOGLE_INTEGRATION_REPOSITORY,
    useClass: GoogleIntegrationRepository,
  },
];

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      CompanyOrmEntity,
      UserOrmEntity,
      ClientOrmEntity,
      NoteOrmEntity,
      AppointmentOrmEntity,
      AttachmentOrmEntity,
      MessageTemplateOrmEntity,
      ProductOrmEntity,
      ClientProductOrmEntity,
      StageOrmEntity,
      PaymentOrmEntity,
      GoogleIntegrationOrmEntity,
      GoogleOAuthStateOrmEntity,
    ]),
  ],
  providers: [...repositoryProviders, StageSeedService],
  exports: [...repositoryProviders, TypeOrmModule],
})
export class DatabaseModule {}
