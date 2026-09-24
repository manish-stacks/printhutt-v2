/**
 * Offers service. Direct port of:
 *   src/app/api/offer/route.ts            POST + GET (admin paginated)
 *   src/app/api/offer/[id]/route.ts       GET, PUT, DELETE (admin)
 *   src/app/api/offer/get-all/route.ts    GET (id+title options)
 */
import { BadRequestError, NotFoundError } from '@/utils/errors';
import { cacheDelPattern, cacheGet, cacheSet } from '@/redis/client';
import { offersRepo } from './offers.repository';
import type {
  CreateOfferDTO,
  ListOffersQueryDTO,
  UpdateOfferDTO,
} from './offers.validation';

const CACHE_PREFIX = 'offers:';
const TTL_SECS = 300;

/* ──────────────── Admin paginated list ──────────────── */
export async function adminList(q: ListOffersQueryDTO): Promise<unknown> {
  const { offers, total } = await offersRepo.adminList(q.page, q.limit, q.search);
  return {
    message: 'Offers fetched successfully',
    data: offers,
    pagination: {
      total,
      pages: Math.ceil(total / q.limit),
      page: q.page,
      limit: q.limit,
    },
  };
}

/* ──────────────── Admin single read ──────────────── */
export async function byId(id: string): Promise<unknown> {
  if (!offersRepo.isValidObjectId(id)) throw new BadRequestError('Invalid Offer ID');
  const offer = await offersRepo.findById(id);
  if (!offer) throw new NotFoundError('Offer not found');
  return offer;
}

/* ──────────────── Admin create ──────────────── */
export async function createOffer(body: CreateOfferDTO): Promise<unknown> {
  const offer = await offersRepo.create({ ...body });
  await cacheDelPattern(`${CACHE_PREFIX}*`);
  return offer;
}

/* ──────────────── Admin update ──────────────── */
export async function updateOffer(id: string, patch: UpdateOfferDTO): Promise<unknown> {
  if (!offersRepo.isValidObjectId(id)) throw new BadRequestError('Invalid Offer ID');
  const updated = await offersRepo.updateById(id, patch);
  if (!updated) throw new NotFoundError('Offer not found');
  await cacheDelPattern(`${CACHE_PREFIX}*`);
  return updated;
}

/* ──────────────── Admin delete ──────────────── */
export async function deleteOffer(id: string): Promise<void> {
  if (!offersRepo.isValidObjectId(id)) throw new BadRequestError('Invalid Offer ID');
  const deleted = await offersRepo.deleteById(id);
  if (!deleted) throw new NotFoundError('Offer not found');
  await cacheDelPattern(`${CACHE_PREFIX}*`);
}

/* ──────────────── Public: get-all (id + title) ──────────────── */
export async function fetchOptions(): Promise<unknown[]> {
  const cacheKey = `${CACHE_PREFIX}options`;
  const hit = await cacheGet<unknown[]>(cacheKey);
  if (hit) return hit;
  const offers = await offersRepo.fetchOptions();
  await cacheSet(cacheKey, offers, TTL_SECS);
  return offers;
}
