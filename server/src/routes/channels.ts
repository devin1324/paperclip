import { Router } from "express";
import type { Db } from "@paperclipai/db";
import { createChannelSchema, createMessageSchema } from "@paperclipai/shared";
import { validate } from "../middleware/validate.js";
import { channelService } from "../services/channels.js";
import { assertCompanyAccess, assertCompanyRole, getActorInfo } from "./authz.js";
import { heartbeatService } from "../services/heartbeat.js";

export function channelRoutes(db: Db) {
  const router = Router();
  const svc = channelService(db);
  const heartbeat = heartbeatService(db);

  router.get("/companies/:companyId/channels", async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);
    const result = await svc.list(companyId);
    res.json(result);
  });

  router.get("/channels/:id", async (req, res) => {
    const id = req.params.id as string;
    const channel = await svc.getById(id);
    if (!channel) {
      res.status(404).json({ error: "Channel not found" });
      return;
    }
    assertCompanyAccess(req, channel.companyId);
    res.json(channel);
  });

  router.post("/companies/:companyId/channels", validate(createChannelSchema), async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyRole(req, companyId, ["admin", "manager"]);
    
    const actor = getActorInfo(req);
    const channel = await svc.create(companyId, actor.actorId, req.body);
    res.status(201).json(channel);
  });

  router.get("/channels/:id/messages", async (req, res) => {
    const id = req.params.id as string;
    const channel = await svc.getById(id);
    if (!channel) {
      res.status(404).json({ error: "Channel not found" });
      return;
    }
    assertCompanyAccess(req, channel.companyId);
    const msgs = await svc.getMessages(id);
    res.json(msgs);
  });

  router.post("/channels/:id/messages", validate(createMessageSchema), async (req, res) => {
    const id = req.params.id as string;
    const channel = await svc.getById(id);
    if (!channel) {
      res.status(404).json({ error: "Channel not found" });
      return;
    }
    const companyId = channel.companyId;
    assertCompanyAccess(req, companyId);
    
    const actor = getActorInfo(req);
    const msg = await svc.createMessage(companyId, id, actor.actorId, req.body);

    // Naive @agent detection logic for the plan
    // If the message contains an "@" mention to an agent, enqueue an AgentRun
    // This is a naive check; ideally it looks up agent ids.
    if (msg.body.includes("@agent")) {
      // In a real implementation we'd extract the actual agent ID.
      // We will skip actual enqueue here without a specific agentId, or just log it.
      // Let's assume we find an agent. For now, we just rely on heartbeat's trigger format if we had an agent ID.
    }

    res.status(201).json(msg);
  });

  return router;
}
