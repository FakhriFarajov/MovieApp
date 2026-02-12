import {create} from "zustand";

export interface User {
  name: string;
  surname: string;
  email: string;
  password: string;
  profileImage?: string;
  phoneNumber?: string;
}

interface UserState {
  users: User[];
  assignUsers: (users: User[]) => void;
  addUser: (user: User) => void;
  reset: () => void;
}

const useUserStore = create<UserState>((set) => ({
  users: [],
  assignUsers: (users) => set({ users }),
  addUser: (user) => set((state) => ({ users: [...state.users, user] })),
  reset: () => set({ users: [] }),
}));

export default useUserStore;