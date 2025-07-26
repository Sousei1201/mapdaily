
"use client";
import React from "react";
import styles from "./page.module.css";
import {MapContent} from "./components/map/Googlemap";
import { APIProvider } from "@vis.gl/react-google-maps";



export default function Home() {
  console.log("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
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
        </div>
      </main>
    </div>
   );
}
