import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "@/lib/router";
import { useCompany } from "@/context/CompanyContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { channelsApi } from "@/api/channels";
import type { Channel, Message } from "@paperclipai/shared";

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return "just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}

export function Channels() {
  const { selectedCompanyId: companyId } = useCompany();
  const params = useParams();
  const queryClient = useQueryClient();
  const channelId = params.channelId;

  const { data: channels } = useQuery<Channel[]>({
    queryKey: ["channels", companyId],
    queryFn: () => channelsApi.list(companyId!),
    enabled: !!companyId,
  });

  const [newChannelName, setNewChannelName] = useState("");
  const createChannel = useMutation({
    mutationFn: (name: string) => channelsApi.create(companyId!, name),
    onSuccess: () => {
      setNewChannelName("");
      queryClient.invalidateQueries({ queryKey: ["channels", companyId] });
    },
  });

  return (
    <div className="flex h-full w-full">
      <div className="w-64 border-r bg-muted/20 p-4 flex flex-col gap-4">
        <h2 className="font-semibold text-lg">Channels</h2>
        <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
          {channels?.map((c) => (
            <Link
              key={c.id}
              to={`/channels/${c.id}`}
              className={`p-2 rounded-md hover:bg-muted ${c.id === channelId ? "bg-muted font-medium" : ""}`}
            >
              # {c.name}
            </Link>
          ))}
        </div>
        <div className="flex flex-col gap-2 pt-4 border-t">
          <Input
            placeholder="New channel name..."
            value={newChannelName}
            onChange={(e) => setNewChannelName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newChannelName.trim()) {
                createChannel.mutate(newChannelName);
              }
            }}
          />
          <Button disabled={!newChannelName.trim() || createChannel.isPending} onClick={() => createChannel.mutate(newChannelName)}>
            Create Channel
          </Button>
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        {channelId ? <ChannelDetail channelId={channelId} /> : <div className="flex-1 flex items-center justify-center text-muted-foreground">Select a channel to start chatting</div>}
      </div>
    </div>
  );
}

function ChannelDetail({ channelId }: { channelId: string }) {
  const queryClient = useQueryClient();
  
  const { data: channel } = useQuery<Channel>({
    queryKey: ["channel", channelId],
    queryFn: () => channelsApi.getById(channelId),
  });

  const { data: messages } = useQuery<Message[]>({
    queryKey: ["channel-messages", channelId],
    queryFn: () => channelsApi.getMessages(channelId),
    refetchInterval: 2000,
  });

  const [messageBody, setMessageBody] = useState("");
  const createMessage = useMutation({
    mutationFn: (body: string) => channelsApi.createMessage(channelId, body),
    onSuccess: () => {
      setMessageBody("");
      queryClient.invalidateQueries({ queryKey: ["channel-messages", channelId] });
    },
  });

  const renderMessageBody = (body: string) => {
    const parts = body.split(/(#[A-Za-z0-9-]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith("#")) {
        const issueId = part.substring(1);
        return (
          <Link key={i} to={`/issues/${issueId}`} className="text-blue-500 hover:underline">
            {part}
          </Link>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4">
        <h2 className="font-semibold text-lg"># {channel?.name ?? "..."}</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col-reverse gap-4">
        {messages?.map((msg) => (
          <div key={msg.id} className="flex flex-col gap-1">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold">{msg.authorId}</span>
              <span className="text-xs text-muted-foreground">{formatRelativeTime(msg.createdAt)}</span>
            </div>
            <div>{renderMessageBody(msg.body)}</div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t">
        <Input
          placeholder={`Message #${channel?.name ?? "..."}`}
          value={messageBody}
          onChange={(e) => setMessageBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && messageBody.trim()) {
              createMessage.mutate(messageBody);
            }
          }}
        />
      </div>
    </div>
  );
}
