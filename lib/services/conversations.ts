import { prisma } from "@/lib/prisma";

export function titleFromMessage(message: string): string {
  const clean = message.replace(/\s+/g, " ").trim();
  return clean.length > 50 ? `${clean.slice(0, 50).trimEnd()}…` : clean;
}

export function listConversations() {
  return prisma.conversation.findMany({
    select: { id: true, title: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getConversationWithMessages(id: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      updatedAt: true,
      messages: {
        select: { id: true, role: true, content: true, createdAt: true },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      },
    },
  });
  return conversation;
}

export async function conversationExists(id: string): Promise<boolean> {
  const found = await prisma.conversation.findUnique({ where: { id }, select: { id: true } });
  return found !== null;
}

export function createConversation(title: string) {
  return prisma.conversation.create({
    data: { title },
    select: { id: true, title: true, updatedAt: true },
  });
}

export async function renameConversation(id: string, title: string) {
  if (!(await conversationExists(id))) return null;
  return prisma.conversation.update({
    where: { id },
    data: { title },
    select: { id: true, title: true, updatedAt: true },
  });
}

export async function deleteConversation(id: string): Promise<boolean> {
  if (!(await conversationExists(id))) return false;
  await prisma.conversation.delete({ where: { id } });
  return true;
}

export async function addMessage(conversationId: string, role: "user" | "assistant", content: string) {
  const [message] = await prisma.$transaction([
    prisma.message.create({ data: { conversationId, role, content } }),
    prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } }),
  ]);
  return message;
}

export async function getRecentMessages(conversationId: string, limit: number) {
  const rows = await prisma.message.findMany({
    where: { conversationId },
    select: { role: true, content: true },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit,
  });
  return rows.reverse();
}
