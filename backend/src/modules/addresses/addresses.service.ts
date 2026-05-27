/**
 * Addresses service. Direct port of:
 *   src/app/api/address/route.ts          GET + POST
 *   src/app/api/address/[id]/route.ts     PUT + DELETE
 *
 * Behaviour preserved exactly. Notably, the POST handler also patches the
 * user record: it backfills the user's username (from fullName) and email
 * when those fields are missing/default — the original did this and the
 * frontend depends on it during first-time checkout.
 */
import { BadRequestError, NotFoundError } from '@/utils/errors';
import { addressesRepo } from './addresses.repository';
import type { AddressDTO, AddressUpdateDTO } from './addresses.validation';

/* ──────────────── 1. List my addresses ──────────────── */
export async function listMyAddresses(userId: string): Promise<unknown> {
  return addressesRepo.findByUser(userId);
}

/* ──────────────── 2. Create address ──────────────── */
export async function createAddress(
  userId: string,
  data: AddressDTO
): Promise<unknown> {
  const user = await addressesRepo.findUserById(userId);
  if (!user) throw new NotFoundError('User not found');

  // Backfill username + email (preserved from original)
  if (!user.username || user.username === 'user') user.username = data.fullName;
  if (!user.email && data.email) user.email = data.email;
  await user.save();

  // First address becomes default; if so, clear any prior defaults
  const addressCount = await addressesRepo.countByUser(userId);
  const isDefault = addressCount === 0;
  if (isDefault) await addressesRepo.clearDefaultForUser(userId);

  const address = await addressesRepo.create({
    userId,
    fullName: data.fullName,
    mobileNumber: data.mobileNumber,
    addressLine: data.addressLine,
    city: data.city,
    state: data.state,
    postCode: data.postCode,
    addressType: data.addressType,
    alternatePhone: data.alternatePhone,
    isDefault,
    email: data.email,
  });

  return address;
}

/* ──────────────── 3. Update address ──────────────── */
export async function updateAddress(
  id: string,
  patch: AddressUpdateDTO
): Promise<unknown> {
  if (!addressesRepo.isValidObjectId(id)) {
    throw new BadRequestError('Invalid Address ID');
  }
  const existing = await addressesRepo.findById(id);
  if (!existing) throw new NotFoundError('Address not found');
  return addressesRepo.updateById(id, patch);
}

/* ──────────────── 4. Delete address ──────────────── */
export async function deleteAddress(id: string): Promise<void> {
  if (!addressesRepo.isValidObjectId(id)) {
    throw new BadRequestError('Invalid Address ID');
  }
  const deleted = await addressesRepo.deleteById(id);
  if (!deleted) throw new NotFoundError('Address not found');
}
