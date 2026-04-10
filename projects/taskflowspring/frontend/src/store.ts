import { createContext, useContext } from 'react';
import type { Member } from './types';

const STORAGE_KEY = 'taskflow_user';

export function getStoredUser(): Member | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function setStoredUser(user: Member | null) {
  if (user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export const UserContext = createContext<{
  user: Member | null;
  setUser: (u: Member | null) => void;
}>({ user: null, setUser: () => {} });

export function useUser() {
  return useContext(UserContext);
}
