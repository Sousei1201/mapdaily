"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "./page.module.css";
import { useAuth } from "@/app/hooks/useAuth";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/app/lib/firebase";
import Link from "next/link";

export default function LoginPage() {
  const [showIntroducemodal, setShowIntroducemodal] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
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
      resetForm();
      router.push('/');
    } catch (error) {
      console.error('Authentication error:', error);
      const errorCode = (error as { code?: string })?.code;
      if (errorCode === 'auth/user-not-found') {
        setError('ユーザーが見つかりません');
      } else if (errorCode === 'auth/invalid-credential') {
        setError('メールアドレスまたはパスワードが間違っています');
      } else if (errorCode === 'auth/wrong-password') {
        setError('パスワードが間違っています');
      } else if (errorCode === 'auth/email-already-in-use') {
        setError('このメールアドレスは既に使用されています');
      } else if (errorCode === 'auth/weak-password') {
        setError('パスワードは6文字以上で入力してください');
      } else if (errorCode === 'auth/invalid-email') {
        setError('メールアドレスの形式が正しくありません');
      } else {
        setError('エラーが発生しました。もう一度お試しください。');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      alert('パスワード再設定用のメールを送信しました。メールをご確認ください。');
      setShowPasswordReset(false);
      setResetEmail('');
    } catch (error) {
      console.error('Password reset error:', error);
      const errorCode = (error as { code?: string })?.code;
      if (errorCode === 'auth/user-not-found') {
        setError('このメールアドレスは登録されていません');
      } else if (errorCode === 'auth/invalid-email') {
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
    setResetEmail('');
    setError('');
    setIsSignUp(false);
    setShowPasswordReset(false);
    setShowLoginModal(false);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headertext}>
          <Link href="/" className={styles.titleLink}>
            <Image
              src="/ふらり旅のきろく.svg"
              alt="ふらり旅のきろく"
              width = {250}
              height = {70}
              className={styles.logo}
              priority
            />
          </Link>
        </div>
      </header>

      <main className={styles.content}>
        {!showLoginModal && !showPasswordReset && showIntroducemodal && (
          <div className={styles.loginRequired}>
            <div className={styles.loginMessage}>
              <h2>ふらり旅のきろくへようこそ</h2>
              <p>さあ、あなたの旅を記録しましょう！</p>
              <button
                onClick={() => {
                  setShowIntroducemodal(false);
                  setShowLoginModal(true);
                }}
                className={styles.loginButton}
              >
                きろくする
              </button>
            </div>
          </div>
        )}

        {showLoginModal && !showPasswordReset && !showIntroducemodal &&  (
          <div className={styles.modalContent}>
            <h2 className={styles.formtitle}>
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

            {!isSignUp && (
              <div className={styles.forgotPassword}>
                <span className={styles.forgotPasswordText}>
                  パスワードをお忘れですか？
                </span>
                <p>
                  <button
                    onClick={() => setShowPasswordReset(true)}
                    className={styles.linkButton}
                    disabled={loading}
                  >
                    パスワードの再設定
                  </button>
                </p>
              </div>
            )}

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
        )}

        {showPasswordReset && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <button onClick={() => setShowPasswordReset(false)} className={styles.closeButton}>
                ×
              </button>

              <h2 className={styles.title}>パスワードの再設定</h2>

              <form onSubmit={handlePasswordReset} className={styles.form}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>メールアドレス</label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className={styles.input}
                    placeholder="登録済みのメールアドレスを入力"
                    required
                    disabled={loading}
                  />
                </div>

                {error && <div className={styles.error}>{error}</div>}

                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={loading}
                >
                  {loading ? '送信中...' : '再設定メールを送信'}
                </button>
              </form>

              <div className={styles.switchMode}>
                <button
                  onClick={() => setShowPasswordReset(false)}
                  className={styles.linkButton}
                  disabled={loading}
                >
                  ログイン画面に戻る
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
