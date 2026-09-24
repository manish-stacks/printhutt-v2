/** Warranty service. Ports src/app/api/warranty/* */
import { BadRequestError, NotFoundError } from '@/utils/errors';
import { warrantyRepo } from './warranty.repository';
import type { ListQueryDTO, PatchDTO, UpsertDTO } from './warranty.validation';

export async function adminList(q: ListQueryDTO): Promise<unknown> {
  const { warranty, total } = await warrantyRepo.adminList(q.page, q.limit, q.search);
  return { warranty, pagination: { total, pages: Math.ceil(total / q.limit), page: q.page, limit: q.limit } };
}

export async function byId(id: string): Promise<unknown> {
  if (!warrantyRepo.isValidObjectId(id)) throw new BadRequestError('Invalid Product ID');
  const w = await warrantyRepo.findById(id);
  if (!w) throw new NotFoundError('Post not found');
  return w;
}

export async function createWarranty(body: UpsertDTO): Promise<unknown> {
  return warrantyRepo.create({ ...body } as unknown as Record<string, unknown>);
}

export async function updateWarranty(id: string, patch: Partial<UpsertDTO>): Promise<unknown> {
  if (!warrantyRepo.isValidObjectId(id)) throw new BadRequestError('Invalid Product ID');
  const existing = await warrantyRepo.findById(id);
  if (!existing) throw new NotFoundError('Warranty not found');
  if (patch.warrantyType !== undefined) {
    (existing as unknown as { warrantyType: unknown }).warrantyType = patch.warrantyType;
  }
  if (patch.durationMonths !== undefined) existing.durationMonths = patch.durationMonths;
  existing.coverage = patch.coverage || existing.coverage;
  existing.claimProcess = patch.claimProcess || existing.claimProcess;
  await existing.save();
  return existing;
}

export async function deleteWarranty(id: string): Promise<void> {
  if (!warrantyRepo.isValidObjectId(id)) throw new BadRequestError('Invalid Product ID');
  const d = await warrantyRepo.deleteById(id);
  if (!d) throw new NotFoundError('Warranty not found');
}

export async function patchStatus(id: string, body: PatchDTO): Promise<unknown> {
  if (!warrantyRepo.isValidObjectId(id)) throw new BadRequestError('Invalid Product ID');
  const updated = await warrantyRepo.updateById(id, { status: body.status });
  if (!updated) throw new NotFoundError('Warranty not found');
  return updated;
}

export async function options(): Promise<unknown[]> {
  return warrantyRepo.options();
}
