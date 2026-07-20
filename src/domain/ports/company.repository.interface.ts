import type { Company } from '../models/company.model';

export const COMPANY_REPOSITORY = 'COMPANY_REPOSITORY';

export interface ICompanyRepository {
  create(company: Partial<Company>): Promise<Company>;
  findById(id: string): Promise<Company | null>;
  update(id: string, company: Partial<Company>): Promise<Company>;
}
