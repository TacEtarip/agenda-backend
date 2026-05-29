import { Company } from '@domain/models/company.model';
import { CompanyOrmEntity } from '../entities/company.orm-entity';

export class CompanyMapper {
  static toDomain(ormEntity: CompanyOrmEntity): Company {
    return new Company(
      ormEntity.id,
      ormEntity.name,
      ormEntity.createdAt,
      ormEntity.updatedAt,
    );
  }

  static toOrmEntity(domain: Partial<Company>): CompanyOrmEntity {
    const ormEntity = new CompanyOrmEntity();
    if (domain.id) ormEntity.id = domain.id;
    if (domain.name) ormEntity.name = domain.name;
    return ormEntity;
  }
}
