import { api } from "./client";
import type { Channel, Message } from "@paperclipai/shared";

export const channelsApi = {
  list: (companyId: string) => api.get(`/api/companies/${companyId}/channels`).then((res: any) => res.data as Channel[]),
  getById: (channelId: string) => api.get(`/api/channels/${channelId}`).then((res: any) => res.data as Channel),
  create: (companyId: string, name: string) =>
    api.post(`/api/companies/${companyId}/channels`, { name }).then((res: any) => res.data as Channel),
  getMessages: (channelId: string) => api.get(`/api/channels/${channelId}/messages`).then((res: any) => res.data as Message[]),
  createMessage: (channelId: string, body: string, threadParentId?: string | null) =>
    api.post(`/api/channels/${channelId}/messages`, { body, threadParentId }).then((res: any) => res.data as Message),
};
