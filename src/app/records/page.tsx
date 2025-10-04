'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

interface RecordData {
  id: string;
  userId: string;
  location: {
    lat: number;
    lng: number;
  };
  address: string;
  image: string | null;
  comment: string;
  timestamp: string;
  createdAt: Date;
}

export default function RecordsPage() {
  const { user, loading } = useAuth();
  const [records, setRecords] = useState<RecordData[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<RecordData | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Firestoreから記録を取得
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'travel-records'),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          ...d,
          createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : new Date(d.createdAt)
        } as RecordData;
      });
      // クライアント側で並び替え
      data.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setRecords(data);
    });

    return () => unsubscribe();
  }, [user]);

  // 日時フォーマット
  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('ja-JP');
  };

  // 記録カードクリック時の処理
  const handleRecordClick = (record: RecordData) => {
    setSelectedRecord(record);
    setShowDetail(true);
  };

  // 詳細モーダルを閉じる
  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedRecord(null);
  };

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
              {records.length === 0 ? (
                <p className={styles.emptyMessage}>まだ記録がありません</p>
              ) : (
                records.map((record) => (
                  <div
                    key={record.id}
                    className={styles.recordCard}
                    onClick={() => handleRecordClick(record)}
                  >
                    {/* 画像表示 */}
                    {record.image && (
                      <div className={styles.recordImageContainer}>
                        <img
                          src={record.image}
                          alt="記録した画像"
                          className={styles.recordImage}
                        />
                      </div>
                    )}

                    {/* 日時表示 */}
                    <div className={styles.recordDateTime}>
                      {formatDateTime(record.timestamp)}
                    </div>

                    {/* コメント表示 */}
                    {record.comment && (
                      <div className={styles.recordComment}>
                        {record.comment}
                      </div>
                    )}

                    {/* 住所表示 */}
                    <div className={styles.recordAddress}>
                      {record.address}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* 記録詳細モーダル */}
      {showDetail && selectedRecord && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            {/* バツボタン */}
            <button
              onClick={handleCloseDetail}
              className={styles.detailCloseButton}
            >
              ×
            </button>

            {/* 画像表示 */}
            {selectedRecord.image && (
              <div className={styles.imageSection}>
                <img
                  src={selectedRecord.image}
                  alt="記録した画像"
                  className={styles.selectedImage}
                />
              </div>
            )}

            {/* 住所表示 */}
            <div className={styles.addressSection}>
              <label className={styles.fieldLabel}>場所</label>
              <div className={styles.addressDisplay}>{selectedRecord.address}</div>
            </div>

            {/* 日時表示 */}
            <div className={styles.datetimeSection}>
              <label className={styles.fieldLabel}>日時</label>
              <div className={styles.datetimeDisplay}>
                {formatDateTime(selectedRecord.timestamp)}
              </div>
            </div>

            {/* コメント表示 */}
            {selectedRecord.comment && (
              <div className={styles.commentSection}>
                <label className={styles.fieldLabel}>コメント</label>
                <div className={styles.commentDisplay}>{selectedRecord.comment}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}