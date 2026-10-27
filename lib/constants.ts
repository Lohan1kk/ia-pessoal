export const MAX_MESSAGE_LENGTH = 8000;
export const MAX_SYSTEM_PROMPT_LENGTH = 4000;
export const HISTORY_LIMIT = 40;

export const MODEL_IDS = ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini", "gpt-4.1"] as const;
export type ModelId = (typeof MODEL_IDS)[number];

export const MODELS: { id: ModelId; label: string; hint: string }[] = [
  { id: "gpt-4o-mini", label: "GPT-4o mini", hint: "Rápido e econômico" },
  { id: "gpt-4o", label: "GPT-4o", hint: "Equilibrado" },
  { id: "gpt-4.1-mini", label: "GPT-4.1 mini", hint: "Rápido, bom em código" },
  { id: "gpt-4.1", label: "GPT-4.1", hint: "Mais capaz" },
];

export const DEFAULT_MODEL: ModelId = "gpt-4o-mini";

export const DEFAULT_SYSTEM_PROMPT =
  "Você é a Lohan AI, uma assistente pessoal inteligente, clara e gentil. " +
  "Responda no idioma do usuário (por padrão, português do Brasil). " +
  "Seja direta, admita quando não souber algo e use Markdown quando ajudar a organizar a resposta.";

export const PERSONALITY_PRESETS: { label: string; prompt: string }[] = [
  { label: "Equilibrada", prompt: DEFAULT_SYSTEM_PROMPT },
  {
    label: "Concisa",
    prompt:
      "Você é a Lohan AI. Responda em português do Brasil, de forma curta e objetiva, indo direto ao ponto. Só detalhe quando o usuário pedir.",
  },
  {
    label: "Professora",
    prompt:
      "Você é a Lohan AI, uma professora paciente. Explique passo a passo, com exemplos simples, em português do Brasil, e confirme se o usuário entendeu antes de avançar para conceitos mais difíceis.",
  },
  {
    label: "Técnica",
    prompt:
      "Você é a Lohan AI, uma engenheira de software sênior. Responda em português do Brasil com precisão técnica, mostre código em blocos Markdown com a linguagem indicada e aponte trade-offs e riscos.",
  },
];

export const SUGGESTIONS: { title: string; prompt: string }[] = [
  { title: "Explicar um conceito", prompt: "Explique como funciona a inflação, com exemplos do dia a dia." },
  { title: "Escrever código", prompt: "Escreva uma função em TypeScript que remove itens duplicados de um array de objetos por uma chave." },
  { title: "Planejar a semana", prompt: "Me ajude a montar uma rotina semanal de estudos de 1 hora por dia, com foco em programação." },
  { title: "Revisar um texto", prompt: "Vou colar um texto e quero que você melhore a clareza e corrija erros, mantendo meu tom." },
];
