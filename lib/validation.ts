import { z } from "zod";
import {
  MAX_MESSAGE_LENGTH,
  MAX_SYSTEM_PROMPT_LENGTH,
  MODEL_IDS,
} from "@/lib/constants";

// IDs gerados pelo Prisma (cuid): começam com "c" e são alfanuméricos minúsculos.
export const idSchema = z.string().regex(/^c[a-z0-9]{20,31}$/, "Identificador inválido.");

export const chatRequestSchema = z.object({
  conversationId: idSchema.optional(),
  message: z
    .string()
    .trim()
    .min(1, "A mensagem não pode estar vazia.")
    .max(MAX_MESSAGE_LENGTH, `A mensagem deve ter no máximo ${MAX_MESSAGE_LENGTH} caracteres.`),
});

export const renameSchema = z.object({
  title: z.string().trim().min(1, "O título não pode estar vazio.").max(120, "Título muito longo."),
});

export const settingsSchema = z.object({
  model: z.enum(MODEL_IDS),
  systemPrompt: z
    .string()
    .trim()
    .max(MAX_SYSTEM_PROMPT_LENGTH, `As instruções devem ter no máximo ${MAX_SYSTEM_PROMPT_LENGTH} caracteres.`),
});
