import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

const API_URL = "http://localhost:5192";


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
  // onRegister accepts the full register payload expected by the backend
  onRegister: (payload: any) => Promise<any>;
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
      const accessToken = await SecureStore.getItemAsync("access_token");
      const refreshToken = await SecureStore.getItemAsync("refresh_token");
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
  // payload should match backend register fields (name, surname, email, password, confirmPassword, phoneNumber, dateOfBirth)
  const onRegister = async (payload: any) => {
    try {
      var result = await api.post("/api/Client/Account/Register", payload);
      console.log("Registration successful:", result);
      return result;
    } catch (error) {
      const msg = (error as any)?.response?.data || (error as any).message || 'Registration failed';
      throw { error: true, msg };
    }
  };

  // LOGIN
  const onLogin = async (email: string, password: string) => {
    try {
      const res = await api.post("/api/Client/Auth/Login", { email, password });
      // backend may wrap tokens: { isSuccess: true, data: { accessToken, refreshToken } }
      const payload = res.data;
      const tokenHolder = payload?.data ?? payload;
      const access_token = tokenHolder?.accessToken ?? tokenHolder?.access_token;
      const refresh_token = tokenHolder?.refreshToken ?? tokenHolder?.refresh_token;

      if (!access_token || !refresh_token) {
        console.error('Login response missing tokens', res.data);
        throw new Error('Invalid login response');
      }
      console.log("Login successful, tokens received");
      api.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
      await SecureStore.setItemAsync("access_token", access_token);
      await SecureStore.setItemAsync("refresh_token", refresh_token);
      setAuthState({ accessToken: access_token, refreshToken: refresh_token, authenticated: true });
      return res;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  // LOGOUT
  const onLogout = async () => {
    api.defaults.headers.common["Authorization"] = "";
    await SecureStore.deleteItemAsync("access_token");
    await SecureStore.deleteItemAsync("refresh_token");
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
