import { prisma } from "@/lib/prisma";
import { DEFAULT_MODEL, DEFAULT_SYSTEM_PROMPT } from "@/lib/constants";

export async function getSettings() {
  const row = await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, model: DEFAULT_MODEL, systemPrompt: DEFAULT_SYSTEM_PROMPT },
    select: { model: true, systemPrompt: true },
  });
  return row;
}

export async function updateSettings(data: { model: string; systemPrompt: string }) {
  return prisma.settings.upsert({
    where: { id: 1 },
    update: data,
    create: { id: 1, ...data },
    select: { model: true, systemPrompt: true },
  });
}
