import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/async-handler';
import { sendOk, sendCreated } from '@/utils/api-response';
import * as service from './messaging.service';
import MessageLog from '@/db/models/messageLog.model';

export const sendManual = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.sendManualMessage(req.body);
  return sendOk(res, data as any);
});

export const getUserLogs = asyncHandler(async (req: Request, res: Response) => {
  const logs = await MessageLog.find({ userId: req.params.userId })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  return sendOk(res, { success: true, logs });
});

export const listLogs = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '20', status, triggerType } = req.query as Record<string, string>;
  const q: any = {};
  if (status) q.status = status;
  if (triggerType) q.triggerType = triggerType;

  const skip = (Number(page) - 1) * Number(limit);
  const [total, logs] = await Promise.all([
    MessageLog.countDocuments(q),
    MessageLog.find(q)
      .populate('userId', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
  ]);

  return sendOk(res, { success: true, total, logs });
});

// export const listTemplates = asyncHandler(async (_req: Request, res: Response) => {
//   return sendOk(res, { success: true, templates: await service.listTemplates() });
// });

// export const createTemplate = asyncHandler(async (req: Request, res: Response) => {
//   return sendCreated(res, { success: true, template: await service.createTemplate(req.body) });
// });

// export const updateTemplate = asyncHandler(async (req: Request, res: Response) => {
//   return sendOk(res, {
//     success: true,
//     template: await service.updateTemplate(String(req.params.id), req.body),
//   });
// });

// export const deleteTemplate = asyncHandler(async (req: Request, res: Response) => {
//   return sendOk(res, (await service.deleteTemplate(String(req.params.id))) as any);
// });

export const triggerOrderPending = asyncHandler(async (_req: Request, res: Response) => {
  return sendOk(res, await service.processOrderPendingReminders() as any);
});

export const triggerWishlistAbandoned = asyncHandler(async (_req: Request, res: Response) => {
  return sendOk(res, await service.processWishlistAbandoned() as any);
});