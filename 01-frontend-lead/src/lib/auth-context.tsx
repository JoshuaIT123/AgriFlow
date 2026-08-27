"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { apiLogin, apiMe, apiRegister, setToken, type PublicUser } from "./api";
import { clearCache, hydrate } from "./remote";
import type { Locale, Role } from "./types";

export function panelHome(role: Role): string {
  return role === "farmer" ? "/farmer/dashboard" : "/buyer/dashboard";
}

const TOKEN_KEY = "agriflow.token.v1";
const PREFS_KEY = "agriflow.prefs.v1";

/**
 * The account shape the panels consume. It mirrors the backend's user plus the
 * two fields the API has no column for (mobile money network and locale),
 * which are kept per-device.
 */
export interface SessionAccount {
  id: string;
  name: string;
  phone: string;
  role: Role;
  locale: Locale;
  mobileMoney: string;
  createdAt: string;
}

function toRole(role: PublicUser["role"]): Role {
  return role === "FARMER" ? "farmer" : "buyer";
}

function readPrefs(): { mobileMoney: string; locale: Locale } {
  if (typeof window === "undefined") return { mobileMoney: "MTN", locale: "en" };
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return { mobileMoney: "MTN", locale: "en" };
    const p = JSON.parse(raw) as { mobileMoney?: string; locale?: Locale };
    return { mobileMoney: p.mobileMoney ?? "MTN", locale: p.locale ?? "en" };
  } catch {
    return { mobileMoney: "MTN", locale: "en" };
  }
}

function writePrefs(prefs: { mobileMoney: string; locale: Locale }) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // non-fatal
  }
}

function toAccount(user: PublicUser): SessionAccount {
  const prefs = readPrefs();
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    role: toRole(user.role),
    locale: prefs.locale,
    mobileMoney: prefs.mobileMoney,
    createdAt: user.createdAt,
  };
}

interface AuthContextValue {
  user: SessionAccount | null;
  ready: boolean;
  login: (phone: string, password: string) => Promise<boolean>;
  register: (input: {
    name: string;
    phone: string;
    password: string;
    mobileMoney: string;
    role: Role;
    locale: Locale;
  }) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionAccount | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  /*
   * Restore the session on mount: the JWT lives in localStorage, so a refresh
   * re-validates it against /api/auth/me rather than trusting a cached user,
   * then pulls that account's server state into the cache.
   */
  useEffect(() => {
    let active = true;
    (async () => {
      let stored: string | null = null;
      try {
        stored = window.localStorage.getItem(TOKEN_KEY);
      } catch {
        stored = null;
      }
      if (!stored) {
        if (active) setReady(true);
        return;
      }
      setToken(stored);
      try {
        const { user: me } = await apiMe();
        if (!active) return;
        const account = toAccount(me);
        setUser(account);
        await hydrate(account.role);
      } catch {
        // Expired or rejected token: drop it and stay logged out.
        setToken(null);
        try {
          window.localStorage.removeItem(TOKEN_KEY);
        } catch {
          // non-fatal
        }
      } finally {
        if (active) setReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const establish = useCallback(
    async (res: { user: PublicUser; accessToken: string }) => {
      setToken(res.accessToken);
      try {
        window.localStorage.setItem(TOKEN_KEY, res.accessToken);
      } catch {
        // non-fatal
      }
      const account = toAccount(res.user);
      setUser(account);
      await hydrate(account.role);
      router.replace(panelHome(account.role));
    },
    [router],
  );

  const login = useCallback(
    async (phone: string, password: string) => {
      try {
        await establish(await apiLogin({ phone, password }));
        return true;
      } catch {
        return false;
      }
    },
    [establish],
  );

  const register = useCallback(
    async (input: {
      name: string;
      phone: string;
      password: string;
      mobileMoney: string;
      role: Role;
      locale: Locale;
    }) => {
      writePrefs({ mobileMoney: input.mobileMoney, locale: input.locale });
      try {
        await establish(
          await apiRegister({
            name: input.name,
            phone: input.phone,
            password: input.password,
            role: input.role === "farmer" ? "FARMER" : "BUYER",
          }),
        );
        return true;
      } catch {
        return false;
      }
    },
    [establish],
  );

  const logout = useCallback(() => {
    setToken(null);
    try {
      window.localStorage.removeItem(TOKEN_KEY);
    } catch {
      // non-fatal
    }
    setUser(null);
    clearCache();
    router.replace("/");
  }, [router]);

  const value = useMemo(
    () => ({ user, ready, login, register, logout }),
    [user, ready, login, register, logout],
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
