'use client';
import React, { useState, useEffect } from 'react';
import { useRecords, TravelRecord } from '../../hooks/useRecords';
import styles from './RecordsList.module.css';

export const RecordsList: React.FC = () => {
  const [records, setRecords] = useState<TravelRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<TravelRecord | null>(null);
  const { fetchUserRecords } = useRecords();

  useEffect(() => {
    const loadRecords = async () => {
      try {
        const userRecords = await fetchUserRecords();
        setRecords(userRecords);
      } catch (error) {
        console.error('記録の取得に失敗しました:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecords();
  }, [fetchUserRecords]);

  // 日時をフォーマット
  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 記録詳細を表示
  const handleRecordClick = (record: TravelRecord) => {
    setSelectedRecord(record);
  };

  // モーダルを閉じる
  const handleCloseModal = () => {
    setSelectedRecord(null);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loading}>記録を読み込み中...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>きろく一覧</h1>
        <div className={styles.recordCount}>
          {records.length}件の記録
        </div>
      </div>

      {records.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📝</div>
          <h2>まだ記録がありません</h2>
          <p>旅の思い出を記録してみましょう！</p>
        </div>
      ) : (
        <div className={styles.recordsGrid}>
          {records.map((record) => (
            <div 
              key={record.id} 
              className={styles.recordCard}
              onClick={() => handleRecordClick(record)}
            >
              <div className={styles.imageContainer}>
                <img 
                  src={record.imageUrl} 
                  alt="旅の記録" 
                  className={styles.recordImage}
                />
              </div>
              <div className={styles.recordInfo}>
                <div className={styles.recordDate}>
                  {formatDateTime(record.timestamp)}
                </div>
                <div className={styles.recordAddress}>
                  {record.address}
                </div>
                {record.comment && (
                  <div className={styles.recordComment}>
                    {record.comment.length > 50 
                      ? `${record.comment.substring(0, 50)}...` 
                      : record.comment
                    }
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 詳細モーダル */}
      {selectedRecord && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button onClick={handleCloseModal} className={styles.closeButton}>
              ×
            </button>
            
            <div className={styles.modalImage}>
              <img 
                src={selectedRecord.imageUrl} 
                alt="旅の記録" 
                className={styles.fullImage}
              />
            </div>
            
            <div className={styles.modalInfo}>
              <div className={styles.modalDate}>
                {formatDateTime(selectedRecord.timestamp)}
              </div>
              
              <div className={styles.modalAddress}>
                <strong>場所:</strong> {selectedRecord.address}
              </div>
              
              {selectedRecord.comment && (
                <div className={styles.modalComment}>
                  <strong>コメント:</strong>
                  <p>{selectedRecord.comment}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};