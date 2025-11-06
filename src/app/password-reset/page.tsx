'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '../lib/firebase';
import styles from './page.module.css';
import Link from 'next/link';

// パスワード再設定のメインコンテンツコンポーネント
function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [oobCode, setOobCode] = useState<string | null>(null);

  // URLパラメータから再設定コードを取得・検証
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

  // パスワード再設定フォームの送信処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // パスワードのバリデーション
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
    } catch (error) {
      console.error('Password reset error:', error);
      const errorCode = (error as { code?: string })?.code;
      if (errorCode === 'auth/weak-password') {
        setError('パスワードは6文字以上で入力してください');
      } else if (errorCode === 'auth/expired-action-code') {
        setError('リンクの有効期限が切れています');
      } else if (errorCode === 'auth/invalid-action-code') {
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
            <Link href="/" className={styles.titleLink}>
              <Image
                src="/ふらり旅のきろく.svg"
                alt="ふらり旅のきろく"
                width={250}
                height={70}
                className={styles.logo}
                priority
              />
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
          <Link href="/" className={styles.titleLink}>
            <Image
              src="/ふらり旅のきろく.svg"
              alt="ふらり旅のきろく"
              className={styles.logo}
              priority
            />
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

// パスワード再設定ページコンポーネント（Suspenseでラップ）
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className={styles.loadingContainer}>
        <div className={styles.loading}>読み込み中...</div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
