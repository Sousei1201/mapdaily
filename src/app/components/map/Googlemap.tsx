'use client';
import React, { useEffect, useState, useRef } from 'react';
import styles from "./Googlemap.module.css";
import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';
import NavigationIcon from './paper-plane-solid.svg';
import RecordIcon from './plus-solid.svg';
import { db } from '../../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';

export const MapContent = () => {
  const [center, setCenter] = useState({ lat: 35.656, lng: 139.737 });
  const [isLoading, setIsLoading] = useState(true);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [currentAddress, setCurrentAddress] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [comment, setComment] = useState('');
  const [isSaving, setIsSaving] = useState(false); // 保存状態を管理
  const mapRef = useRef(null);
  const { user, loading } = useAuth();
  

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

  // 画像選択の処理
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 記録を保存する処理
  const handleSaveRecord = async () => {
    if (!user) {
      alert('ログインが必要です');
      return;
    }

    setIsSaving(true); // 保存開始

    try {
      const recordData = {
        userId: user.uid,
        location: {
          lat: center.lat,
          lng: center.lng
        },
        address: currentAddress,
        image: selectedImage, // base64形式の画像データ
        comment: comment,
        timestamp: new Date(),
        createdAt: new Date()
      };

      // Firestoreに保存
      const docRef = await addDoc(collection(db, 'records'), recordData);
      console.log('記録が保存されました。ID:', docRef.id);
      
      // 成功時の処理
      alert('記録を保存しました！');
      
      // モーダルを閉じて、フォームをリセット
      setShowRecordModal(false);
      setSelectedImage(null);
      setComment('');
      
    } catch (error) {
      console.error('記録の保存に失敗しました:', error);
      alert('記録の保存に失敗しました。もう一度お試しください。');
    } finally {
      setIsSaving(false); // 保存完了（成功・失敗問わず）
    }
  };

  // キャンセル確認の処理
  const handleCancelClick = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmCancel = () => {
    setShowRecordModal(false);
    setShowConfirmDialog(false);
    setSelectedImage(null);
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

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
      <Map
        center={center}
        defaultZoom={15}
        disableDefaultUI={true}
        onLoad={(map) => { mapRef.current = map; }}
      >
        {!isLoading && <Marker position={center} />}
      </Map>
      
      <button onClick={goToCurrentLocation} className={styles.currentwarp}>
        <NavigationIcon className={styles.navIcon} />
      </button>
      
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
                disabled={isSaving}
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
                disabled={isSaving}
              />
            </div>

            {/* 保存ボタン */}
            <button 
              onClick={handleSaveRecord} 
              className={styles.saveButton}
              disabled={isSaving}
            >
              {isSaving ? '保存中...' : '記録を保存'}
            </button>

            {/* キャンセルボタン（赤い正円） */}
            <button 
              onClick={handleCancelClick} 
              className={styles.cancelButton}
              disabled={isSaving}
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

    </APIProvider>
  );
};

export default MapContent;