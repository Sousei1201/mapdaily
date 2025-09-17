'use client';
import React from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { useAuth } from '../hooks/useAuth';

export default function RecordsPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loading}>読み込み中...</div>
      </div>
    );
  }

  if (!user) {
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
            <div className={styles.loginRequired}>
              <div className={styles.loginMessage}>
                <h2>ログインが必要です</h2>
                <p>記録一覧を表示するにはログインしてください</p>
                <Link href="/" className={styles.loginButton}>
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
          <nav className={styles.nav}>
            <Link href="/">マップ</Link>
            <span className={styles.currentPage}>きろく一覧</span>
          </nav>
        </div>
      </header>
      <main>
        <div className={styles.content}>
          <div className={styles.recordsContainer}>
            <h1 className={styles.pageTitle}>きろく一覧</h1>
            <div className={styles.recordsList}>
              {/* ここに記録の一覧が表示される予定 */}
              <p className={styles.emptyMessage}>記録の表示機能は今後実装予定です</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}