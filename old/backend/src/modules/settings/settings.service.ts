/**
 * Site settings service — key-value site config.
 * Public GET returns a flat object { key: value } for the frontend layout.
 * Admin bulk-update persists multiple settings in one shot.
 */
import { cacheDelPattern, cacheGet, cacheSet } from '@/redis/client';
import { deleteImage, uploadImage, type MulterFile } from '@/utils/storage';
import { BadRequestError } from '@/utils/errors';
import { settingsRepo } from './settings.repository';
import type { BulkUpsertDTO, SingleUpsertDTO } from './settings.validation';

const CACHE_KEY_PUBLIC = 'settings:public';
const CACHE_KEY_ADMIN = 'settings:admin';
const TTL = 300;

/* ─── Public flat map (used by layout / sitemap / robots) ─── */
export async function publicMap(): Promise<Record<string, unknown>> {
  const hit = await cacheGet<Record<string, unknown>>(CACHE_KEY_PUBLIC);
  if (hit) return hit;

  const all = (await settingsRepo.all()) as Array<{ key: string; value: unknown }>;
  const out: Record<string, unknown> = {};
  for (const s of all) out[s.key] = s.value;

  await cacheSet(CACHE_KEY_PUBLIC, out, TTL);
  return out;
}

/* ─── Admin full list (with type/group/label) ─── */
export async function adminAll(): Promise<unknown[]> {
  const hit = await cacheGet<unknown[]>(CACHE_KEY_ADMIN);
  if (hit) return hit;
  const all = await settingsRepo.all();
  await cacheSet(CACHE_KEY_ADMIN, all, TTL);
  return all;
}

/* ─── Single setting by key ─── */
export async function byKey(key: string): Promise<unknown> {
  return settingsRepo.byKey(key);
}

/* ─── Bulk upsert (admin form submit) ─── */
export async function bulkUpsert(body: BulkUpsertDTO): Promise<unknown[]> {
  const results = await Promise.all(
    body.settings.map((s) =>
      settingsRepo.upsert(s.key, s.value, s.type, s.group, s.label, s.description)
    )
  );
  await invalidateCache();
  return results;
}

/* ─── Single upsert ─── */
export async function singleUpsert(body: SingleUpsertDTO): Promise<unknown> {
  const result = await settingsRepo.upsert(
    body.key,
    body.value,
    body.type,
    body.group,
    body.label,
    body.description
  );
  await invalidateCache();
  return result;
}

/* ─── Image upload (favicon / logo / ogImage) ─── */
export async function uploadImageSetting(
  key: string,
  file: MulterFile | undefined,
  group = 'identity'
): Promise<unknown> {
  if (!file) throw new BadRequestError('Image file is required');

  // pehle ka image delete
  const existing = (await settingsRepo.byKey(key)) as { value?: { public_id?: string } } | null;
  if (existing?.value?.public_id) {
    await deleteImage(existing.value.public_id).catch(() => undefined);
  }

  const uploaded = await uploadImage(file, 'site-settings', 800, 800);
  const result = await settingsRepo.upsert(key, uploaded, 'image', group);
  await invalidateCache();
  return result;
}

/* ─── Delete ─── */
export async function remove(key: string): Promise<void> {
  const existing = (await settingsRepo.byKey(key)) as {
    value?: { public_id?: string };
    type?: string;
  } | null;
  if (existing?.type === 'image' && existing?.value?.public_id) {
    await deleteImage(existing.value.public_id).catch(() => undefined);
  }
  await settingsRepo.delete(key);
  await invalidateCache();
}

async function invalidateCache(): Promise<void> {
  await cacheDelPattern('settings:*');
}