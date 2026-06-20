import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ApiRequestError,
  getMe,
  login as apiLogin,
  register as apiRegister,
} from "../lib/api";
import { clearToken, getToken, setToken } from "../lib/auth";
import type { UserMe } from "../lib/apiTypes";

interface AuthContextValue {
  user: UserMe | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    displayName: string,
    password: string,
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider(props: { children: ReactNode }) {
  const [user, setUser] = useState<UserMe | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (token === null) {
      setIsLoading(false);
      return;
    }

    getMe()
      .then((me) => {
        setUser(me);
      })
      .catch((error: unknown) => {
        if (error instanceof ApiRequestError && error.status === 401) {
          clearToken();
        }
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const tokenResponse = await apiLogin({ email, password });
    setToken(tokenResponse.access_token);
    const me = await getMe();
    setUser(me);
  }, []);

  const register = useCallback(
    async (email: string, displayName: string, password: string) => {
      await apiRegister({
        email,
        display_name: displayName,
        password,
      });
      await login(email, password);
    },
    [login],
  );

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, login, register, logout }),
    [user, isLoading, login, register, logout],
  );

  return (
    <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
