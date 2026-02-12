import { createContext, useState, useContext, ReactNode, useEffect } from "react";
import axios from "axios";

const API_URL = import.meta.env?.VITE_AUTH_API || "http://localhost:5192";
console.log("API_URL:", API_URL);

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  authenticated: boolean | null;
}

interface AuthProps {
  authState?: AuthState;
  onRegister: (email: string, password: string) => Promise<any>;
  onLogin: (email: string, password: string) => Promise<any>;
  onLogout: () => Promise<void>;
}

const AuthContext = createContext<AuthProps>({} as AuthProps);

export const useAuth = () => {
  return useContext(AuthContext);
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [authState, setAuthState] = useState<AuthState>({
    accessToken: null,
    refreshToken: null,
    authenticated: null,
  });


  useEffect(() => {
    const loadTokens = async () => {
      const accessToken = await localStorage.getItem("access_token");
      const refreshToken = await localStorage.getItem("refresh_token");
      if (accessToken && refreshToken) {
        api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
        setAuthState({
          accessToken,
          refreshToken,
          authenticated: true,
        });
      }
    };
    loadTokens();
  }, []);

  // REGISTER
  const onRegister = async (email: string, password: string) => {
    try {
      return await api.post("/auth/register", {
        email,
        password,
      });
    } catch (error) {
      throw {error:true , msg: (error as any).response.message};
    }
  };

  // LOGIN
  const onLogin = async (email: string, password: string) => {
    try {
      const res = await api.post("/api/Admin/Auth/Login", {
        email,
        password,
      });
      const { access_token, refresh_token } = res.data.data;
      api.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
      await localStorage.setItem("access_token", access_token);
      await localStorage.setItem("refresh_token", refresh_token);
      setAuthState({
        accessToken: access_token,
        refreshToken: refresh_token,
        authenticated: true,
      });
      return res;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  // LOGOUT
  const onLogout = async () => {
    api.defaults.headers.common["Authorization"] = "";
    await localStorage.removeItem("access_token");
    await localStorage.removeItem("refresh_token");
    setAuthState({
      accessToken: null,
      refreshToken: null,
      authenticated: false,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        authState,
        onRegister,
        onLogin,
        onLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
