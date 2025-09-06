
"use client";
import React, { useState }  from "react";
import styles from "./page.module.css";
import {MapContent} from "./components/map/Googlemap";
import { APIProvider } from "@vis.gl/react-google-maps";    
import { useAuth } from "@/app/hooks/useAuth";
import { LoginModal } from "@/app/components/auth/LoginModal";

export default function Home() {
  console.log("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
  const [showHowToUse, setShowHowToUse] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { user, loading, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      alert('ログアウトしました');
    } catch (error) {
      console.error('ログアウトエラー:', error);
      alert('ログアウトに失敗しました');
    }
  };

  const handleHowToUseClick = () => {
    setShowHowToUse(true);
  };

  const handleLoginClick = () => {
    setShowLoginModal(true);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loading}>読み込み中...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headertext}>
          <div className={styles.title}>ふらり旅のきろく</div>
          <nav className={styles.nav}>
            <a onClick={handleHowToUseClick}>つかいかた</a>
            {user ? (
              <>
                <a>きろく一覧</a>
                <a onClick={handleSignOut} className={styles.signOutButton}>
                  ログアウト
                </a>
              </>
            ) : (
              <a onClick={handleLoginClick}>ログイン</a>
            )}
          </nav>
        </div> 
      </header>
      <main>
        <div className={styles.content}>
          {user ? (
            <MapContent/>
          ) : (
            <div className={styles.loginRequired}>
              <div className={styles.loginMessage}>
                <h2>ふらり旅のきろくへようこそ</h2>
                <p>旅の思い出を記録するにはログインが必要です</p>
                <button 
                  onClick={handleLoginClick} 
                  className={styles.loginButton}
                >
                  ログイン
                </button>
              </div>
            </div>
          )}
          
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
                <p>右下の＋ボタンを押すと記録できます。きろく一覧で今までの記録を一覧で見ることができます。</p>
              </div>
            </div>
          )}
        </div>
      </main>
      
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
    </div>
   );
}
