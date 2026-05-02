import { eq, desc } from "drizzle-orm";
import type { Db } from "@paperclipai/db";
import { channels, messages } from "@paperclipai/db";
import type { Channel, Message } from "@paperclipai/shared";

export function channelService(db: Db) {
  return {
    async list(companyId: string): Promise<Channel[]> {
      return db.select().from(channels).where(eq(channels.companyId, companyId)).orderBy(desc(channels.createdAt));
    },

    async getById(id: string): Promise<Channel | undefined> {
      const rows = await db.select().from(channels).where(eq(channels.id, id));
      return rows[0];
    },

    async create(companyId: string, authorId: string, data: { name: string }): Promise<Channel> {
      const rows = await db
        .insert(channels)
        .values({
          companyId,
          createdBy: authorId,
          name: data.name,
        })
        .returning();
      return rows[0]!;
    },

    async getMessages(channelId: string): Promise<Message[]> {
      return db.select().from(messages).where(eq(messages.channelId, channelId)).orderBy(desc(messages.createdAt));
    },

    async createMessage(
      companyId: string,
      channelId: string,
      authorId: string,
      data: { body: string; threadParentId?: string | null },
    ): Promise<Message> {
      const rows = await db
        .insert(messages)
        .values({
          companyId,
          channelId,
          authorId,
          body: data.body,
          threadParentId: data.threadParentId ?? null,
        })
        .returning();
      return rows[0]!;
    },
  };
}
