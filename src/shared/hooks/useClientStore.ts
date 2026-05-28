import { create } from "zustand";
import type { ClientMeta } from "../types";

interface ClientStore {
  clients: ClientMeta[];
  activeClientSlug: string | null;
  setActiveClient: (slug: string) => void;
  setClients: (clients: ClientMeta[]) => void;
}

export const useClientStore = create<ClientStore>((set) => ({
  clients: [],
  activeClientSlug: null,
  setActiveClient: (slug) => set({ activeClientSlug: slug }),
  setClients: (clients) => set({ clients }),
}));
