'use client';
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import styles from './LoginModal.module.css';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password);
        alert('アカウントを作成しました！');
      } else {
        await signIn(email, password);
        alert('ログインしました！');
      }
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('Authentication error:', error);
       // デバッグ用：エラーの詳細を表示
      // alert(`Error code: ${error.code}, Message: ${error.message}`);
      if (error.code === 'auth/user-not-found') {
        setError('ユーザーが見つかりません');
      } else if (error.code === 'auth/invalid-credential') {
        setError('メールアドレスまたはパスワードが間違っています');
      } else if (error.code === 'auth/wrong-password') {
        setError('パスワードが間違っています');
      } else if (error.code === 'auth/email-already-in-use') {
        setError('このメールアドレスは既に使用されています');
      } else if (error.code === 'auth/weak-password') {
        setError('パスワードは6文字以上で入力してください');
      } else if (error.code === 'auth/invalid-email') {
        setError('メールアドレスの形式が正しくありません');
      } else {
        setError('エラーが発生しました。もう一度お試しください。');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setError('');
    setIsSignUp(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <button onClick={handleClose} className={styles.closeButton}>
          ×
        </button>
        
        <h2 className={styles.title}>
          {isSignUp ? 'アカウント作成' : 'ログイン'}
        </h2>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              required
              disabled={loading}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              required
              disabled={loading}
              minLength={6}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? '処理中...' : (isSignUp ? 'アカウント作成' : 'ログイン')}
          </button>
        </form>

        <div className={styles.switchMode}>
          {isSignUp ? (
            <p>
              アカウントをお持ちですか？
              <button 
                onClick={() => setIsSignUp(false)} 
                className={styles.linkButton}
                disabled={loading}
              >
                ログインはこちら
              </button>
            </p>
          ) : (
            <p>
              アカウントをお持ちでありませんか？
              <button 
                onClick={() => setIsSignUp(true)} 
                className={styles.linkButton}
                disabled={loading}
              >
                アカウント作成
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};