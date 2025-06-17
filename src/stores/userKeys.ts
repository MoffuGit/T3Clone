import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type Provider } from "~/lib/llmProviders";

type APIKeys = Record<Provider, string>;

type UserAPIKeysStore = {
  keys: APIKeys;
  setKeys: (newKeys: Partial<APIKeys>) => void;
  hasRequiredKeys: () => boolean;
  getKey: (provider: Provider) => string | null;
  cleanKeys: () => void;
};

export const useAPIKeyStore = create<UserAPIKeysStore>()(
  persist(
    (set, get) => ({
      keys: {
        google: "",
        openrouter: "",
        openai: "",
      },

      setKeys: (newKeys) => {
        const current = get().keys;
        const updatedKeys: APIKeys = {
          ...current,
          ...newKeys,
        } as APIKeys;

        set(() => ({ keys: updatedKeys }));
      },

      hasRequiredKeys: () => {
        return !!get().keys.google;
      },

      getKey: (provider) => {
        const key = get().keys[provider];
        return key ?? null;
      },
      cleanKeys: () => {
        set(() => ({ keys: {} }));
      },
    }),
    {
      name: "users-keys",
      partialize: (state) => ({ keys: state.keys }),
    },
  ),
);
