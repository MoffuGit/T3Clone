import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type AIModel } from "~/lib/llmProviders";

interface LLMProviderState {
  selectedModel: AIModel;
  setSelectedModel: (model: AIModel) => void;
}

export const useLLMProviderStore = create<LLMProviderState>()(
  persist(
    (set) => ({
      selectedModel: "Deepseek R1 0528",
      setSelectedModel: (model) => {
        set({
          selectedModel: model,
        });
      },
    }),
    { name: "llm-providers" },
  ),
);
