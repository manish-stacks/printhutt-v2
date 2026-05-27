/** Ports src/app/api/get-signed-url/route.ts — returns S3 PUT-signed URL. */
import { BadRequestError } from '@/utils/errors';
import { signUrl } from '@/utils/storage';

export async function getSignedUrl(public_id: string): Promise<string> {
  if (!public_id) throw new BadRequestError('public_id not found');
  return signUrl(public_id);
}
