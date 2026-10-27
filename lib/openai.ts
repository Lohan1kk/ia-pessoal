import OpenAI from "openai";

export const MISSING_KEY_MESSAGE =
  "A chave da OpenAI não está configurada. Crie o arquivo .env.local na raiz do projeto com OPENAI_API_KEY=sua_chave e reinicie o servidor (npm run dev).";

export class MissingApiKeyError extends Error {
  constructor() {
    super(MISSING_KEY_MESSAGE);
    this.name = "MissingApiKeyError";
  }
}

let client: OpenAI | null = null;

export function hasApiKey(): boolean {
  const key = process.env.OPENAI_API_KEY;
  return typeof key === "string" && key.trim().length > 0;
}

export function getOpenAI(): OpenAI {
  if (!hasApiKey()) throw new MissingApiKeyError();
  client ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY!.trim(), maxRetries: 1 });
  return client;
}

export interface DescribedError {
  status: number;
  code: string;
  message: string;
}

export function describeOpenAIError(err: unknown): DescribedError {
  if (err instanceof MissingApiKeyError) {
    return { status: 503, code: "missing_api_key", message: MISSING_KEY_MESSAGE };
  }
  if (err instanceof OpenAI.APIUserAbortError) {
    return { status: 499, code: "aborted", message: "A requisição foi cancelada." };
  }
  if (err instanceof OpenAI.APIConnectionError) {
    return {
      status: 502,
      code: "network",
      message: "Não foi possível conectar à API da OpenAI. Verifique sua conexão com a internet e tente novamente.",
    };
  }
  if (err instanceof OpenAI.APIError) {
    const status = err.status ?? 500;
    if (status === 401) {
      return { status: 502, code: "invalid_api_key", message: "A chave da OpenAI é inválida. Confira o valor de OPENAI_API_KEY no .env.local." };
    }
    if (status === 429) {
      if (err.code === "insufficient_quota") {
        return { status: 429, code: "insufficient_quota", message: "A cota da sua conta OpenAI acabou. Verifique o plano e o saldo em platform.openai.com." };
      }
      return { status: 429, code: "rate_limited", message: "Limite de requisições atingido. Aguarde alguns instantes e tente novamente." };
    }
    if (status === 404 || status === 403) {
      return { status: 502, code: "model_unavailable", message: "O modelo selecionado não está disponível para a sua conta. Escolha outro nas configurações." };
    }
    if (status === 400) {
      return { status: 400, code: "bad_request", message: "A OpenAI recusou a requisição. Tente reformular a mensagem." };
    }
    if (status >= 500) {
      return { status: 502, code: "upstream_error", message: "O serviço da OpenAI está com problemas no momento. Tente novamente em instantes." };
    }
  }
  return { status: 500, code: "internal", message: "Ocorreu um erro inesperado ao gerar a resposta." };
}
