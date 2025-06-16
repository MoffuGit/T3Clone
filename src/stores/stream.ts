import { create } from "zustand";

interface StreamingStore {
  drivenIds: Set<string>;
  addDrivenId: (id: string) => void;
  clearDrivenIds: () => void;
  removeDrivenId: (id: string) => void;
}

export const useStreamingStore = create<StreamingStore>((set, get) => ({
  drivenIds: new Set(),

  addDrivenId: (id: string) => {
    const updated = new Set(get().drivenIds);
    updated.add(id);
    set({ drivenIds: updated });
  },

  removeDrivenId: (id: string) => {
    const updated = new Set(get().drivenIds);
    updated.delete(id);
    set({ drivenIds: updated });
  },

  clearDrivenIds: () => {
    set({ drivenIds: new Set() });
  },
}));
