import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../../utils/supabase";

export type UserRole = "ADMIN" | "CLIENTE" | "DOCTOR";

export type Usuario = {
  id: number;
  auth_user_id?: string | null;
  nombre: string;
  apellido?: string | null;
  email?: string | null;
  rol: UserRole;
  telefono?: string | null;
  created_at?: string | null;
};

type UserContextValue = {
  session: Session | null;
  authUser: User | null;
  usuario: Usuario | null;
  role: UserRole | null;
  loading: boolean;
  refreshUsuario: () => Promise<void>;
  signOut: () => Promise<void>;
};

const UserContext = createContext<UserContextValue | undefined>(undefined);

function normalizeRole(role?: string | null): UserRole {
  const normalized = role?.toUpperCase();

  if (normalized === "ADMIN" || normalized === "DOCTOR") {
    return normalized;
  }

  return "CLIENTE";
}

function normalizeUsuario(row: any): Usuario {
  return {
    id: Number(row.id),
    auth_user_id: row.auth_user_id ?? null,
    nombre: row.nombre ?? "Usuario",
    apellido: row.apellido ?? null,
    email: row.email ?? null,
    rol: normalizeRole(row.rol),
    telefono: row.telefono ?? null,
    created_at: row.created_at ?? null,
  };
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUsuario = useCallback(async (activeSession: Session | null) => {
    if (!activeSession?.user) {
      setUsuario(null);
      return;
    }

    const authUser = activeSession.user;
    const currentColumns =
      "id,auth_user_id,nombre,apellido,email,rol,telefono,created_at";
    const legacyColumns = "id,nombre,apellido,email,rol,telefono,created_at";
    let data: any = null;
    let error: any = null;

    const currentProfile = await supabase
      .from("USUARIOS")
      .select(currentColumns)
      .eq("auth_user_id", authUser.id)
      .maybeSingle();

    data = currentProfile.data;
    error = currentProfile.error;

    if ((!data || error) && authUser.email) {
      const fallback = await supabase
        .from("USUARIOS")
        .select(currentColumns)
        .eq("email", authUser.email)
        .maybeSingle();

      data = fallback.data;
      error = fallback.error;
    }

    if (error && authUser.email) {
      const legacyFallback = await supabase
        .from("USUARIOS")
        .select(legacyColumns)
        .eq("email", authUser.email)
        .maybeSingle();

      data = legacyFallback.data;
      error = legacyFallback.error;
    }

    if (error) {
      console.warn("No se pudo cargar el usuario:", error.message);
      setUsuario(null);
      return;
    }

    setUsuario(data ? normalizeUsuario(data) : null);
  }, []);

  const refreshUsuario = useCallback(async () => {
    await loadUsuario(session);
  }, [loadUsuario, session]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut({ scope: "local" });
    setUsuario(null);
    setSession(null);
  }, []);

  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      const {
        data: { session: initialSession },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      setSession(initialSession);
      await loadUsuario(initialSession);
      if (mounted) setLoading(false);
    };

    boot();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      await loadUsuario(nextSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadUsuario]);

  const value = useMemo<UserContextValue>(
    () => ({
      session,
      authUser: session?.user ?? null,
      usuario,
      role: usuario?.rol ?? null,
      loading,
      refreshUsuario,
      signOut,
    }),
    [loading, refreshUsuario, session, signOut, usuario],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error("useUser debe usarse dentro de UserProvider");
  }

  return context;
}
