import { create } from "zustand";

interface LogoutModalStore {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const useLogoutModal = create<LogoutModalStore>((set) => ({
  isOpen: false,
  setIsOpen: (isOpen) => set({ isOpen }),
}));
