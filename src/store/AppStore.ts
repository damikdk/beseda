import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware"; // For persisting state in async storage

interface AppState {
  token: string;
  devMode: boolean;
}

type AppActions = {
  setToken: (token: string) => void;
  setDevMode: (newValue: boolean) => void;
};

export const useStore = create<AppState & AppActions>()(
  persist(
    (set) => ({
      token: "",
      devMode: false,

      setToken: (token: string) => set({ token }),
      setDevMode: (newValue: boolean) => set({ devMode: newValue }),
    }),
    {
      name: "app-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
