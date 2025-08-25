
"use client";
import React, { useEffect, useState, useRef }  from "react";
import styles from "./page.module.css";
import {MapContent} from "./components/map/Googlemap";
import { APIProvider } from "@vis.gl/react-google-maps";    



export default function Home() {
  console.log("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
  const [showHowToUse, setShowHowToUse] = useState(false);
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headertext}>
          <div className={styles.title}>ふらり旅のきろく</div>
          <nav className={styles.nav}>
              <a>つかいかた</a>

              <a>きろく一覧</a> 
          </nav>
        </div> 
      </header>
      <main>
        <div className={styles.content}>
          <MapContent/>
        {showHowToUse && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <div className={styles.modalTitle}>つかいかた</div>
              <a>右下の＋ボタンを押すと記録できます。きろく一覧で今までの記録を一覧で見ることができます。</a>
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
    
   );

}
