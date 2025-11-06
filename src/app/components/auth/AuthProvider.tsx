'use client';
import React, { createContext, useContext } from 'react';
import { User } from 'firebase/auth';
import { useAuth as useAuthHook } from '../../hooks/useAuth';

// 認証コンテキストの型定義
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// 認証コンテキストの作成
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});

// 認証コンテキストを使用するカスタムフック
export const useAuthContext = () => useContext(AuthContext);

// 認証プロバイダーコンポーネント（useAuthフックをラップ）
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const authData = useAuthHook();

  return (
    <AuthContext.Provider value={authData}>
      {children}
    </AuthContext.Provider>
  );
};