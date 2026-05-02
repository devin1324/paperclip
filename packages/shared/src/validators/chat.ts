import { z } from "zod";

export const createChannelSchema = z.object({
  name: z.string().min(1).max(255),
});

export const createMessageSchema = z.object({
  body: z.string().min(1),
  threadParentId: z.string().optional().nullable(),
});
