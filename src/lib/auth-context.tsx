"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  createAccount,
  getAccount,
  readSession,
  verifyLogin,
  writeSession,
  type StoredAccount,
} from "./store";
import type { Locale, Role } from "./types";

export function panelHome(role: Role): string {
  return role === "farmer" ? "/farmer/dashboard" : "/buyer/dashboard";
}

/*
 * Auth state is held in a tiny external store read from localStorage via
 * useSyncExternalStore. This is the React-recommended way to expose
 * client-only data (localStorage) without causing a hydration mismatch:
 * the server snapshot is always null, the client then re-syncs from storage
 * after hydration.
 */
let cachedUser: StoredAccount | null = null;
let ready = false;
const listeners = new Set<() => void>();

function loadFromStorage(): StoredAccount | null {
  if (typeof window === "undefined") return null;
  const id = readSession();
  return getAccount(id);
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot(): StoredAccount | null {
  if (typeof window === "undefined") return cachedUser;
  if (!ready) {
    cachedUser = loadFromStorage();
    ready = true;
  }
  return cachedUser;
}

const NO_SERVER_SNAPSHOT: StoredAccount | null = null;
function getServerSnapshot(): StoredAccount | null {
  return NO_SERVER_SNAPSHOT;
}

function publishUser(user: StoredAccount | null) {
  cachedUser = user;
  ready = true;
  listeners.forEach((fn) => fn());
}

interface AuthContextValue {
  user: StoredAccount | null;
  login: (phone: string, password: string) => boolean;
  register: (input: {
    name: string;
    phone: string;
    password: string;
    mobileMoney: string;
    role: Role;
    locale: Locale;
  }) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const user = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const router = useRouter();

  const login = useCallback(
    (phone: string, password: string) => {
      const account = verifyLogin(phone, password);
      if (!account) return false;
      writeSession(account.id);
      publishUser(account);
      router.replace(panelHome(account.role));
      return true;
    },
    [router]
  );

  const register = useCallback(
    (input: {
      name: string;
      phone: string;
      password: string;
      mobileMoney: string;
      role: Role;
      locale: Locale;
    }) => {
      const account = createAccount(input);
      writeSession(account.id);
      publishUser(account);
      router.replace(panelHome(account.role));
      return true;
    },
    [router]
  );

  const logout = useCallback(() => {
    writeSession(null);
    publishUser(null);
    router.replace("/");
  }, [router]);

  const value = useMemo(
    () => ({ user, login, register, logout }),
    [user, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
