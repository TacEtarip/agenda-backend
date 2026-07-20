import { Company } from '@domain/models/company.model';
import { CompanyOrmEntity } from '../entities/company.orm-entity';

export class CompanyMapper {
  static toDomain(ormEntity: CompanyOrmEntity): Company {
    const company = new Company(
      ormEntity.id,
      ormEntity.name,
      ormEntity.createdAt,
      ormEntity.updatedAt,
    );
    company.yapeEnabled = ormEntity.yapeEnabled;
    company.yapePhone = ormEntity.yapePhone ?? undefined;
    company.yapeAccountName = ormEntity.yapeAccountName ?? undefined;
    company.yapeQrImageDataUrl = ormEntity.yapeQrImageDataUrl ?? undefined;
    return company;
  }

  static toOrmEntity(domain: Partial<Company>): CompanyOrmEntity {
    const ormEntity = new CompanyOrmEntity();
    if (domain.id) ormEntity.id = domain.id;
    if (domain.name) ormEntity.name = domain.name;
    if (domain.yapeEnabled !== undefined)
      ormEntity.yapeEnabled = domain.yapeEnabled;
    if (domain.yapePhone !== undefined)
      ormEntity.yapePhone = domain.yapePhone || null;
    if (domain.yapeAccountName !== undefined)
      ormEntity.yapeAccountName = domain.yapeAccountName || null;
    if (domain.yapeQrImageDataUrl !== undefined)
      ormEntity.yapeQrImageDataUrl = domain.yapeQrImageDataUrl || null;
    return ormEntity;
  }
}
