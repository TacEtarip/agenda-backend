import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { ICompanyRepository } from '@domain/ports/company.repository.interface';
import type { Company } from '@domain/models/company.model';
import { CompanyOrmEntity } from '../entities/company.orm-entity';
import { CompanyMapper } from '../mappers/company.mapper';

@Injectable()
export class CompanyRepository implements ICompanyRepository {
  constructor(
    @InjectRepository(CompanyOrmEntity)
    private readonly repository: Repository<CompanyOrmEntity>,
  ) {}

  async create(company: Partial<Company>): Promise<Company> {
    const ormEntity = CompanyMapper.toOrmEntity(company);
    const savedEntity = await this.repository.save(ormEntity);
    return CompanyMapper.toDomain(savedEntity);
  }

  async findById(id: string): Promise<Company | null> {
    const ormEntity = await this.repository.findOne({ where: { id } });
    return ormEntity ? CompanyMapper.toDomain(ormEntity) : null;
  }

  async update(id: string, company: Partial<Company>): Promise<Company> {
    await this.repository.update(id, CompanyMapper.toOrmEntity(company));
    const updated = await this.repository.findOneOrFail({ where: { id } });
    return CompanyMapper.toDomain(updated);
  }
}
