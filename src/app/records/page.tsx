'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { useAuth } from '../hooks/useAuth';
import { db, storage } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
  const { user, loading, signOut } = useAuth();
  const [records, setRecords] = useState<RecordData[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<RecordData | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editComment, setEditComment] = useState('');
  const [editImage, setEditImage] = useState<string | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      alert('ログアウトしました');
    } catch (error) {
      console.error('ログアウトエラー:', error);
      alert('ログアウトに失敗しました');
    }
  };

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

      // 重複を除去（同じIDのレコードが複数ある場合は最初の1つだけ残す）
      const uniqueData = data.filter((record, index, self) =>
        index === self.findIndex((r) => r.id === record.id)
      );

      // クライアント側で並び替え
      uniqueData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setRecords(uniqueData);
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
    if (isEditMode) {
      setShowConfirmCancel(true);
    } else {
      setShowDetail(false);
      setSelectedRecord(null);
    }
  };

  // 画像をFirebase Storageにアップロードする関数
  const uploadImageToStorage = async (file: File, userId: string) => {
    try {
      const timestamp = new Date().getTime();
      const fileName = `${timestamp}_${file.name}`;
      const imageRef = ref(storage, `travel-images/${userId}/${fileName}`);
      const snapshot = await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('画像アップロードエラー:', error);
      throw error;
    }
  };

  // 編集モードに入る
  const handleStartEdit = () => {
    if (selectedRecord) {
      setEditComment(selectedRecord.comment);
      setEditImage(selectedRecord.image);
      setEditImageFile(null);
      setIsEditMode(true);
    }
  };

  // 編集をキャンセル
  const handleCancelEdit = () => {
    setShowConfirmCancel(false);
    setIsEditMode(false);
    setShowDetail(false);
    setSelectedRecord(null);
    setEditComment('');
    setEditImage(null);
    setEditImageFile(null);
  };

  // 編集キャンセルを取り消し
  const handleKeepEditing = () => {
    setShowConfirmCancel(false);
  };

  // 編集画像の変更
  const handleEditImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setEditImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setEditImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 記録を更新
  const handleUpdateRecord = async () => {
    if (!selectedRecord || !user) return;

    setUploading(true);

    try {
      let imageURL = editImage;

      // 新しい画像がある場合はアップロード
      if (editImageFile) {
        imageURL = await uploadImageToStorage(editImageFile, user.uid);
      }

      const recordRef = doc(db, 'travel-records', selectedRecord.id);
      await updateDoc(recordRef, {
        comment: editComment,
        image: imageURL
      });
      alert('記録を更新しました');
      setIsEditMode(false);
      setShowDetail(false);
      setSelectedRecord(null);
      setEditComment('');
      setEditImage(null);
      setEditImageFile(null);
    } catch (error) {
      console.error('更新エラー:', error);
      alert('記録の更新に失敗しました');
    } finally {
      setUploading(false);
    }
  };

  // 削除確認ダイアログを表示
  const handleShowDeleteConfirm = () => {
    setShowConfirmDelete(true);
  };

  // 削除をキャンセル
  const handleCancelDelete = () => {
    setShowConfirmDelete(false);
  };

  // 記録を削除
  const handleDeleteRecord = async () => {
    if (!selectedRecord) return;

    try {
      const recordRef = doc(db, 'travel-records', selectedRecord.id);
      await deleteDoc(recordRef);
      alert('記録を削除しました');
      setShowConfirmDelete(false);
      setIsEditMode(false);
      setShowDetail(false);
      setSelectedRecord(null);
      setEditComment('');
    } catch (error) {
      console.error('削除エラー:', error);
      alert('記録の削除に失敗しました');
    }
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
            <a onClick={handleSignOut} className={styles.signOutButton}>
              ログアウト
            </a>
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

            {/* 画像表示・編集 */}
            {isEditMode ? (
              <div className={styles.imageSection}>
                <label htmlFor="record-edit-image-upload" className={styles.imageUploadLabel}>
                  {editImage ? (
                    <img src={editImage} alt="選択された画像" className={styles.selectedImage} />
                  ) : (
                    <div className={styles.imagePlaceholder}>
                      <span>画像を選択</span>
                    </div>
                  )}
                </label>
                <input
                  id="record-edit-image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleEditImageChange}
                  className={styles.hiddenInput}
                  disabled={uploading}
                />
              </div>
            ) : (
              selectedRecord.image && (
                <div className={styles.imageSection}>
                  <img
                    src={selectedRecord.image}
                    alt="記録した画像"
                    className={styles.selectedImage}
                  />
                </div>
              )
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

            {/* コメント表示・編集 */}
            <div className={styles.commentSection}>
              <label className={styles.fieldLabel}>コメント</label>
              {isEditMode ? (
                <textarea
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  className={styles.commentInput}
                  placeholder="コメントを入力してください"
                  rows={4}
                  disabled={uploading}
                />
              ) : (
                <div className={styles.commentDisplay}>{selectedRecord.comment || 'コメントなし'}</div>
              )}
            </div>

            {/* ボタンエリア */}
            {isEditMode ? (
              <div className={styles.buttonContainer}>
                <button
                  onClick={handleUpdateRecord}
                  className={styles.saveButton}
                  disabled={uploading}
                >
                  {uploading ? '保存中...' : '保存'}
                </button>
                <button
                  onClick={handleShowDeleteConfirm}
                  className={styles.deleteButton}
                  disabled={uploading}
                >
                  削除
                </button>
              </div>
            ) : (
              <div className={styles.buttonContainer}>
                <button onClick={handleStartEdit} className={styles.editButton}>
                  編集・削除
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 編集キャンセル確認ダイアログ */}
      {showConfirmCancel && (
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmDialog}>
            <p className={styles.confirmMessage}>記録の編集をやめますか？</p>
            <div className={styles.confirmButtons}>
              <button onClick={handleCancelEdit} className={styles.confirmYes}>
                はい
              </button>
              <button onClick={handleKeepEditing} className={styles.confirmNo}>
                いいえ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 削除確認ダイアログ */}
      {showConfirmDelete && (
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmDialog}>
            <p className={styles.confirmMessage}>この記録を削除しますか？</p>
            <div className={styles.confirmButtons}>
              <button onClick={handleDeleteRecord} className={styles.confirmYes}>
                はい
              </button>
              <button onClick={handleCancelDelete} className={styles.confirmNo}>
                いいえ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}