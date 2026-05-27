/** Return-policy service. Ports src/app/api/return-policy/* */
import { BadRequestError, NotFoundError } from '@/utils/errors';
import { returnPolicyRepo } from './return-policy.repository';
import type { ListQueryDTO, UpsertDTO } from './return-policy.validation';

export async function adminList(q: ListQueryDTO): Promise<unknown> {
  const { returndata, total } = await returnPolicyRepo.adminList(q.page, q.limit, q.search);
  return { returndata, pagination: { total, pages: Math.ceil(total / q.limit), page: q.page, limit: q.limit } };
}

export async function byId(id: string): Promise<unknown> {
  if (!returnPolicyRepo.isValidObjectId(id)) throw new BadRequestError('Invalid Return Policy ID');
  const p = await returnPolicyRepo.findById(id);
  if (!p) throw new NotFoundError('Return Policy not found');
  return p;
}
export async function create(body: UpsertDTO): Promise<unknown> {
  return returnPolicyRepo.create({ ...body });
}
export async function update(id: string, patch: Partial<UpsertDTO>): Promise<unknown> {
  if (!returnPolicyRepo.isValidObjectId(id)) throw new BadRequestError('Invalid Return Policy ID');
  const updated = await returnPolicyRepo.updateById(id, patch);
  if (!updated) throw new NotFoundError('Return Policy not found');
  return updated;
}
export async function remove(id: string): Promise<void> {
  if (!returnPolicyRepo.isValidObjectId(id)) throw new BadRequestError('Invalid Return Policy ID');
  const d = await returnPolicyRepo.deleteById(id);
  if (!d) throw new NotFoundError('Return Policy not found');
}
export async function options(): Promise<unknown[]> {
  return returnPolicyRepo.options();
}
