'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '../lib/firebase';
import styles from './page.module.css';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [oobCode, setOobCode] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('oobCode');
    if (!code) {
      setError('無効なリンクです');
      setVerifying(false);
      return;
    }

    // コードの検証
    verifyPasswordResetCode(auth, code)
      .then(() => {
        setOobCode(code);
        setVerifying(false);
      })
      .catch((error) => {
        console.error('Code verification error:', error);
        setError('リンクが無効または期限切れです');
        setVerifying(false);
      });
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // パスワードの検証
    if (newPassword.length < 6) {
      setError('パスワードは6文字以上で入力してください');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }

    if (!oobCode) {
      setError('無効なリンクです');
      return;
    }

    setLoading(true);

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      alert('パスワードを再設定しました！ログインしてください。');
      router.push('/?openLogin=true');
    } catch (error: any) {
      console.error('Password reset error:', error);
      if (error.code === 'auth/weak-password') {
        setError('パスワードは6文字以上で入力してください');
      } else if (error.code === 'auth/expired-action-code') {
        setError('リンクの有効期限が切れています');
      } else if (error.code === 'auth/invalid-action-code') {
        setError('無効なリンクです');
      } else {
        setError('エラーが発生しました。もう一度お試しください。');
      }
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingContainer}>
          <div className={styles.loading}>読み込み中...</div>
        </div>
      </div>
    );
  }

  if (error && !oobCode) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headertext}>
            <Link href="/" className={styles.title}>
              ふらり旅のきろく
            </Link>
          </div>
        </header>
        <main>
          <div className={styles.content}>
            <div className={styles.errorContainer}>
              <div className={styles.errorMessage}>
                <h2>{error}</h2>
                <Link href="/" className={styles.homeButton}>
                  ホームに戻る
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headertext}>
          <Link href="/" className={styles.title}>
            ふらり旅のきろく
          </Link>
        </div>
      </header>
      <main>
        <div className={styles.content}>
          <div className={styles.formContainer}>
            <h1 className={styles.pageTitle}>パスワードの再設定</h1>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>新しいパスワード</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={styles.input}
                  required
                  disabled={loading}
                  minLength={6}
                  placeholder="6文字以上で入力してください"
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>新しいパスワード（確認）</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={styles.input}
                  required
                  disabled={loading}
                  minLength={6}
                  placeholder="もう一度入力してください"
                />
              </div>

              {error && <div className={styles.error}>{error}</div>}

              <button
                type="submit"
                className={styles.submitButton}
                disabled={loading}
              >
                {loading ? '処理中...' : '再設定'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
