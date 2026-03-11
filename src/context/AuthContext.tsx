// src/context/AuthContext.tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  getCurrentUser,
  login,
  logout,
  refreshToken,
  register,
  RegisterResponse,
} from "@/services/authService";

interface User {
  id:string;
  name: string;
  email: string;
  avatar?: string;
  role?:string;
}

interface RegisterPayload {
  organization: {
    name: string;
    slug: string;
    email: string;
    company_id: string;
    password: string;
    phone: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  representative?: any;
}

interface LoginResponse {
  user: User;
  organization: {
    slug: string;
    name: string;
    [key: string]: any;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginUser: (data: { email: string; password: string }) => Promise<LoginResponse>;
  registerUser: (data: RegisterPayload) => Promise<RegisterResponse>; // ✅ aqui
  logoutUser: () => Promise<void>;
  refreshUserToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Inicializa usuário ao carregar a página
  useEffect(() => {
    (async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch {
        // Token expirado — tenta renovar antes de deslogar
        try {
          await refreshToken();
          const currentUser = await getCurrentUser();
          setUser(currentUser);
        } catch {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Login
  const loginUser = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<LoginResponse> => {
    setLoading(true);
    try {
      const data = await login({ email, password }); // data vem do backend com accessToken e organization

      const currentUser = await getCurrentUser();
      setUser(currentUser);

      return {
        user: currentUser,
        organization: data.organization, // garante que a organização vem do backend
      };
    } catch (err) {
      setUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Registro
  const registerUser = async (
    data: RegisterPayload,
  ): Promise<RegisterResponse> => {
    setLoading(true);
    try {
      const result = await register(data);
      // getCurrentUser é opcional — não deve derrubar o cadastro se falhar
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch {
        // silencia: conta criada, login será feito na próxima tela
      }
      return result;
    } catch (err) {
      setUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logoutUser = async () => {
    setLoading(true);
    try {
      await logout();
      setUser(null);
      router.push("/login"); // redireciona para login
    } finally {
      setLoading(false);
    }
  };

  // Refresh token
  const refreshUserToken = async () => {
    setLoading(true);
    try {
      await refreshToken();
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginUser,
        registerUser,
        logoutUser,
        refreshUserToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook para consumir contexto
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useAuth deve ser usado dentro do AuthProvider");
  return context;
};
