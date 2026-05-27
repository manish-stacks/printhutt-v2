/**
 * Shipping service. Ports:
 *   src/app/api/shipping/*
 *   src/app/api/fship/track/route.ts
 *   src/app/api/shiprocket/*
 */
import axios from 'axios';
import { BadRequestError, NotFoundError } from '@/utils/errors';
import { fshipToken, shiprocketAuth } from '@/utils/helpers';
import { shippingRepo } from './shipping.repository';
import type { ListQueryDTO, UpsertDTO } from './shipping.validation';

export async function adminList(q: ListQueryDTO): Promise<unknown> {
  const { shipping, total } = await shippingRepo.adminList(q.page, q.limit, q.search);
  return { shipping, pagination: { total, pages: Math.ceil(total / q.limit), page: q.page, limit: q.limit } };
}
export async function byId(id: string): Promise<unknown> {
  if (!shippingRepo.isValidObjectId(id)) throw new BadRequestError('Invalid id');
  const s = await shippingRepo.findById(id);
  if (!s) throw new NotFoundError('Shipping not found');
  return s;
}
export async function create(body: UpsertDTO): Promise<unknown> {
  return shippingRepo.create({ ...body });
}
export async function update(id: string, patch: Partial<UpsertDTO>): Promise<unknown> {
  if (!shippingRepo.isValidObjectId(id)) throw new BadRequestError('Invalid id');
  const updated = await shippingRepo.updateById(id, patch);
  if (!updated) throw new NotFoundError('Shipping not found');
  return updated;
}
export async function remove(id: string): Promise<void> {
  if (!shippingRepo.isValidObjectId(id)) throw new BadRequestError('Invalid id');
  const d = await shippingRepo.deleteById(id);
  if (!d) throw new NotFoundError('Shipping not found');
}
export async function options(): Promise<unknown[]> {
  return shippingRepo.options();
}

/* ─── fship/shiprocket integration ─── */
export async function fshipTrack(waybill: string): Promise<unknown> {
  if (!waybill) throw new BadRequestError('waybill is required');
  const token = fshipToken();
  const { data } = await axios.post(
    'https://capi.fship.in/api/Tracking',
    JSON.stringify({ waybill }),
    { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
  );
  return data;
}

export async function shiprocketTrack(awb: string): Promise<unknown> {
  if (!awb) throw new BadRequestError('awb is required');
  const token = await shiprocketAuth();
  const { data } = await axios.get(
    `https://apiv2.shiprocket.in/v1/external/courier/track/awb/${awb}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
}

export async function shiprocketCreateOrder(body: unknown): Promise<unknown> {
  const token = await shiprocketAuth();
  const { data } = await axios.post(
    'https://apiv2.shiprocket.in/v1/external/orders/create/adhoc',
    body,
    { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
  );
  return data;
}

// Shiprocket webhook — caller passes raw body; we don't validate signature here
// (env vars + IP allowlisting handled at the gateway).
export async function shiprocketWebhook(body: unknown): Promise<unknown> {
  // log + return ack — actual order-status update is done via /api/orders/:id/status
  return { ok: true, received: !!body };
}
