
"use client";
import React, { useState, useEffect }  from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "./page.module.css";
import {MapContent} from "./components/map/Googlemap";
import { useAuth } from "@/app/hooks/useAuth";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const [showHowToUse, setShowHowToUse] = useState(false);
  const { user, loading, signOut} = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      alert('ログアウトしました');
      router.push('/login');
    } catch (error) {
      console.error('ログアウトエラー:', error);
      alert('ログアウトに失敗しました');
    }
  };

  const handleHowToUseClick = () => {
    setShowHowToUse(true);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loading}>読み込み中...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headertext}>
          <div className={styles.titleLink}>
            <Image
              src="/ふらり旅のきろく.svg"
              alt="ふらり旅のきろく"
              width = {250}
              height = {70}
              className={styles.logo}
              priority
            />
          </div>
          <nav className={styles.nav}>
            <a onClick={handleHowToUseClick}>つかいかた</a>
            <Link href="./records">きろく一覧</Link>
            <a onClick={handleSignOut} className={styles.signOutButton}>
              ログアウト
            </a>
          </nav>
        </div>
      </header>
      <main>
        <div className={styles.content}>
          <MapContent/>

          {showHowToUse && (
            <div className={styles.modalOverlay}>
              <div className={styles.modalContent}>
                <button
                  onClick={() => setShowHowToUse(false)}
                  className={styles.closeButton}
                >
                  ×
                </button>
                <div className={styles.modalTitle}>つかいかた</div>
                <p>右下の＋ボタンを押すときろくできます。きろく一覧で今までの記録を一覧で見ることができます。</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
   );
}
