export const PROVIDERS = ["GOOGLE", "OPENAI", "OPENROUTER"];
export type Provider = (typeof PROVIDERS)[number];

export const AI_MODELS = [
  "Deepseek R1 0528",
  "Deepseek V3",
  "Llama 4 Maverick",
  "Gemini 2.5 Pro",
  "Gemini 2.5 Flash",
  "Gemini 2.0 Flash",
  "Gemini 2.0 Flash Exp",
] as const;

export type AIModel = (typeof AI_MODELS)[number];

export const PROVIDERS_MODELS = {
  GOOGLE: ["Gemini 2.5 Pro", "Gemini 2.5 Flash"],
  OPENAI: [],
  OPENROUTER: ["Deepseek R1 0528", "Deepseek V3", "Llama 4 Maverick"],
} as const satisfies Record<Provider, AIModel[]>;

export type ModelConfig = {
  modelId: string;
  provider: Provider;
  headerKey: string;
  fileInput: boolean;
  searchGrounding: boolean;
  imageGeneration: boolean;
};

export const MODEL_CONFIGS = {
  "Deepseek R1 0528": {
    modelId: "deepseek/deepseek-r1-0528:free",
    provider: "openrouter",
    headerKey: "X-OpenRouter-API-Key",
    fileInput: false,
    searchGrounding: false,
    imageGeneration: false,
  },
  "Deepseek V3": {
    modelId: "deepseek/deepseek-chat-v3-0324:free",
    provider: "openrouter",
    headerKey: "X-OpenRouter-API-Key",
    fileInput: false,
    searchGrounding: false,
    imageGeneration: false,
  },
  "Llama 4 Maverick": {
    modelId: "meta-llama/llama-3.3-8b-instruct:free",
    provider: "openrouter",
    headerKey: "X-OpenRouter-API-Key",
    fileInput: false,
    searchGrounding: false,
    imageGeneration: false,
  },
  "Gemini 2.5 Pro": {
    modelId: "gemini-2.5-pro-preview-05-06",
    provider: "google",
    headerKey: "X-Google-API-Key",
    fileInput: true,
    searchGrounding: true,
    imageGeneration: false,
  },
  "Gemini 2.5 Flash": {
    modelId: "gemini-2.5-flash-preview-04-17",
    provider: "google",
    headerKey: "X-Google-API-Key",
    fileInput: true,
    searchGrounding: true,
    imageGeneration: false,
  },
  "Gemini 2.0 Flash": {
    modelId: "gemini-2.0-flash",
    provider: "google",
    headerKey: "X-Google-API-Key",
    fileInput: true,
    searchGrounding: true,
    imageGeneration: false,
  },
  "Gemini 2.0 Flash Exp": {
    modelId: "gemini-2.0-flash-exp",
    provider: "google",
    headerKey: "X-Google-API-Key",
    fileInput: true,
    searchGrounding: true,
    imageGeneration: true,
  },
} as const satisfies Record<AIModel, ModelConfig>;

export const getModelConfig = (modelName: AIModel): ModelConfig => {
  return MODEL_CONFIGS[modelName];
};
