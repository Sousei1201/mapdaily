'use client';
import React, { useEffect, useState, useRef } from 'react';
import styles from "./Googlemap.module.css";
import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';
import NavigationIcon from './paper-plane-solid.svg';
import RecordIcon from './plus-solid.svg';
import { useAuth } from '../../hooks/useAuth';
import { storage, db } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, onSnapshot, query, where, orderBy } from 'firebase/firestore';

interface RecordData {
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

      // const recordData = {
      //   userId : user.uid,
      //   location: {
      //     lat: center.lat,
      //     lng: center.lng
      //   },
      //   address: currentAddress,
      //   imageURL: imageURL,
      //   comment: comment,
      //   timestamp: new Date().toISOString(),
      //   createdAt: new Date()
      // };

export const MapContent = () => {
  const [center, setCenter] = useState({ lat: 35.656, lng: 139.737 });
  const [isLoading, setIsLoading] = useState(true);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [currentAddress, setCurrentAddress] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // 追加: File オブジェクトを保存
  const [comment, setComment] = useState('');
  const [records, setRecords] = useState<RecordData[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<RecordData | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [uploading, setUploading] = useState(false); // 追加: アップロード状態
  const mapRef = useRef<google.maps.Map | null>(null);
  const { user, loading} = useAuth(); // 追加: ユーザー情報取得
  
 // --- Firestore リアルタイム同期 ---
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
          userId: doc.id,
          ...d,
          createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : new Date(d.createdAt)
        } as RecordData;
      });
      setRecords(data);
    });

    return () => unsubscribe();
  }, [user]);

// --- 現在地の取得 ---
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCenter(pos);
          setIsLoading(false);
          mapRef.current?.panTo(pos);
        },
        (error) => {
          console.error("現在地の取得に失敗しました:", error);
          setIsLoading(false);
        }
      );
    } else {
      console.error("このブラウザでは現在地を取得できません。");
      setIsLoading(false);
    }
  }, []);

  const goToCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCenter(pos);
          mapRef.current?.panTo(pos);
          mapRef.current?.setZoom(15);
        },
        () => {
          alert("現在地を取得できませんでした");
        }
      );
    } else {
      alert("このブラウザではGeolocationがサポートされていません。");
    }
  };

  // 住所を取得する関数
  const getCurrentAddress = async (lat, lng) => {
    try {
      const geocoder = new google.maps.Geocoder();
      const response = await new Promise((resolve, reject) => {
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === 'OK' && results[0]) {
            resolve(results[0].formatted_address);
          } else {
            reject('住所を取得できませんでした');
          }
        });
      });
      return response;
    } catch (error) {
      console.error('住所取得エラー:', error);
      return '住所を取得できませんでした';
    }
  };

  // 記録ボタンを押したときの処理
  const handleRecordClick = async () => {
    setShowRecordModal(true);
    // 現在地の住所を取得
    const address = await getCurrentAddress(center.lat, center.lng);
    setCurrentAddress(address);
  };

  // 画像選択の処理 (修正: File オブジェクトも保存)
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file); // File オブジェクトを保存
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 画像をFirebase Storageにアップロードする関数
  const uploadImageToStorage = async (file, userId) => {
    try {
      // ファイル名を生成 (タイムスタンプ + 元のファイル名)
      const timestamp = new Date().getTime();
      const fileName = `${timestamp}_${file.name}`;
      
      // Storage参照を作成 (ルールに合わせたパス)
      const imageRef = ref(storage, `travel-images/${userId}/${fileName}`);
      
      // ファイルをアップロード
      const snapshot = await uploadBytes(imageRef, file);
      console.log('画像アップロード完了:', snapshot);
      
      // ダウンロードURLを取得
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('ダウンロードURL:', downloadURL);
      
      return downloadURL;
    } catch (error) {
      console.error('画像アップロードエラー:', error);
      throw error;
    }
  };

  // 記録をFirestoreに保存する関数
  const saveRecordToFirestore = async (recordData) => {
    try {
      const docRef = await addDoc(collection(db, `travel-records/`), recordData);
      console.log('記録保存完了:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('記録保存エラー:', error);
      throw error;
    }
  };

  // 記録を保存する処理 (修正: 実際のアップロード処理を実装)
  const handleSaveRecord = async () => {
    if (!user) {
      alert('ログインが必要です');
      return;
    }

    setUploading(true);

    try {
      let imageURL = null;

      // 画像がある場合はアップロード
      if (selectedFile) {
        imageURL = await uploadImageToStorage(selectedFile, user.uid);
      }

      // 記録データを作成
      // const recordData = {
      //   userId: user.uid,
      //   location: {
      //     lat: center.lat,
      //     lng: center.lng
      //   },
      //   address: currentAddress,
      //   imageURL: imageURL,
      //   comment: comment,
      //   timestamp: new Date().toISOString(),
      //   createdAt: new Date()
      // };

      const newRecord: RecordData = {
        userId: user.uid,
        location: {
          lat: center.lat,
          lng: center.lng
        },
        address: currentAddress,
        image: imageURL,
        comment: comment,
        timestamp: new Date().toISOString(),
        createdAt: new Date()
      };

      // Firestoreに保存
      await saveRecordToFirestore(newRecord);
      
      // モーダルを閉じて、フォームをリセット
      setShowRecordModal(false);
      setSelectedImage(null);
      setSelectedFile(null);
      setComment('');
      alert('記録を保存しました！');

    } catch (error) {
      console.error('保存処理エラー:', error);
      
      // エラーメッセージをより詳細に
      if (error.code === 'storage/unauthorized') {
        alert('画像のアップロード権限がありません。ログインを確認してください。\nユーザーID: ${user?.uid}\nエラー: ${error.message}');
      } else if (error.code === 'permission-denied') {
        alert('データベースへの書き込み権限がありません。');
      } else {
        alert('保存に失敗しました。もう一度お試しください。');
      }
    } finally {
      setUploading(false);
    }
  };

  // キャンセル確認の処理
  const handleCancelClick = () => {
    setShowConfirmDialog(true);
  };

 // 肉球ピンクリックの処理
  const handleRecordMarkerClick = (record : RecordData) => {
    setSelectedRecord(record);
    setShowPopup(true);
  };

  // ポップアップを閉じる処理
  const handleClosePopup = () => {
    setShowPopup(false);
    setSelectedRecord(null);
  };

    // --- 日時フォーマット ---
  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('ja-JP');
  };

  const handleConfirmCancel = () => {
    setShowRecordModal(false);
    setShowConfirmDialog(false);
    setSelectedImage(null);
    setSelectedFile(null); // 追加: File オブジェクトもリセット
    setComment('');
  };

  const handleCancelCancel = () => {
    setShowConfirmDialog(false);
  };

  // 現在の日時を取得
  const getCurrentDateTime = () => {
    const now = new Date();
    return now.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loading}>読み込み中...</div>
      </div>
    );
  }

  // 肉球アイコンコンポーネント
  const PawMarkerIcon = () => (
    <div className={styles.pawMarker}>
      <PawIcon className={styles.pawIcon} />
    </div>
  );

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>

      
      <button onClick={goToCurrentLocation} className={styles.currentwarp}>
        <NavigationIcon className={styles.navIcon} />
      </button>
        {!isLoading && (
          <Map
            defaultCenter={center}
            defaultZoom={15}
            disableDefaultUI={true}
            ref={mapRef}
          >
          <Marker position={center} />
          {/* 記録された場所の肉球ピン */}
          {records.map((record) => (
            <Marker
              key={`${record.userId}-${record.location.lat}-${record.location.lng}`}
              position={record.location}
              onClick={() => handleRecordMarkerClick(record)}
            >
            </Marker>
            ))}
          </Map>
        )}      
      <button onClick={handleRecordClick} className={styles.recordmenu}>
        <RecordIcon className={styles.plusIcon} />
      </button>

      {/* 記録モーダル */}
      {showRecordModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            {/* 画像挿入スペース */}
            <div className={styles.imageSection}>
              <label htmlFor="image-upload" className={styles.imageUploadLabel}>
                {selectedImage ? (
                  <img src={selectedImage} alt="選択された画像" className={styles.selectedImage} />
                ) : (
                  <div className={styles.imagePlaceholder}>
                    <span>画像を選択</span>
                  </div>
                )}
              </label>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className={styles.hiddenInput}
                disabled={uploading} // アップロード中は無効化
              />
            </div>

            {/* 現在地の住所 */}
            <div className={styles.addressSection}>
              <label className={styles.fieldLabel}>現在地の住所</label>
              <div className={styles.addressDisplay}>{currentAddress}</div>
            </div>

            {/* 日付と記録時刻 */}
            <div className={styles.datetimeSection}>
              <label className={styles.fieldLabel}>日付と記録時刻</label>
              <div className={styles.datetimeDisplay}>{getCurrentDateTime()}</div>
            </div>

            {/* コメント入力欄 */}
            <div className={styles.commentSection}>
              <label className={styles.fieldLabel}>コメント</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="旅の思い出を記録しましょう..."
                className={styles.commentInput}
                disabled={uploading} // アップロード中は無効化
              />
            </div>

            {/* 保存ボタン (修正: アップロード状態を表示) */}
            <button 
              onClick={handleSaveRecord} 
              className={styles.saveButton}
              disabled={uploading}
            >
              {uploading ? '保存中...' : '記録を保存'}
            </button>

            {/* キャンセルボタン (修正: アップロード中は無効化) */}
            <button 
              onClick={handleCancelClick} 
              className={styles.cancelButton}
              disabled={uploading}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* 確認ダイアログ */}
      {showConfirmDialog && (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialogContent}>
            <p className={styles.dialogMessage}>記録をやめますか？</p>
            <div className={styles.dialogButtons}>
              <button onClick={handleConfirmCancel} className={styles.dialogYes}>
                はい
              </button>
              <button onClick={handleCancelCancel} className={styles.dialogNo}>
                いいえ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 記録ポップアップ */}
      {showPopup && selectedRecord && (
        <div className={styles.popupOverlay} onClick={handleClosePopup}>
          <div className={styles.popupContent} onClick={(e) => e.stopPropagation()}>
            <button onClick={handleClosePopup} className={styles.popupCloseButton}>
              ×
            </button>
            
            {/* 画像表示 */}
            {selectedRecord.image && (
              <div className={styles.popupImageContainer}>
                <img 
                  src={selectedRecord.image} 
                  alt="記録した画像" 
                  className={styles.popupImage}
                />
              </div>
            )}
            
            {/* 日時表示 */}
            <div className={styles.popupDateTime}>
              {formatDateTime(selectedRecord.timestamp)}
            </div>
            
            {/* コメント表示 */}
            {selectedRecord.comment && (
              <div className={styles.popupComment}>
                {selectedRecord.comment}
              </div>
            )}
            
            {/* 住所表示 */}
            <div className={styles.popupAddress}>
              {selectedRecord.address}
            </div>
          </div>
        </div>
      )}

    </APIProvider>
  );
};

export default MapContent;