export interface Channel {
  id: string;
  companyId: string;
  name: string;
  createdBy: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  companyId: string;
  channelId: string;
  authorId: string;
  threadParentId: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
}
