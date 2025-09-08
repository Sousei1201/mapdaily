'use client';
import React, { useEffect, useState, useRef } from 'react';
import styles from "./Googlemap.module.css";
import { APIProvider, Map, Marker, InfoWindow } from '@vis.gl/react-google-maps';
import NavigationIcon from './paper-plane-solid.svg';
import RecordIcon from './plus-solid.svg';
import { useRecords, TravelRecord } from '../../hooks/useRecords';

export const MapContent = () => {
  const [center, setCenter] = useState({ lat: 35.656, lng: 139.737 });
  const [isLoading, setIsLoading] = useState(true);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [currentAddress, setCurrentAddress] = useState('');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [records, setRecords] = useState<TravelRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<TravelRecord | null>(null);
  const mapRef = useRef(null);
  const { loading: recordLoading, saveRecord, fetchUserRecords } = useRecords();

  // 記録データを取得
  useEffect(() => {
    const loadRecords = async () => {
      try {
        const userRecords = await fetchUserRecords();
        setRecords(userRecords);
      } catch (error) {
        console.error('記録の取得に失敗しました:', error);
      }
    };
    
    if (!isLoading) {
      loadRecords();
    }
  }, [isLoading, fetchUserRecords]);

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
  const getCurrentAddress = async (lat: number, lng: number): Promise<string> => {
    try {
      const geocoder = new google.maps.Geocoder();
      const response = await new Promise<string>((resolve, reject) => {
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

  // 画像選択・撮影の処理
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 記録を保存する処理
  const handleSaveRecord = async () => {
    if (!selectedImageFile) {
      alert('画像を選択してください');
      return;
    }

    try {
      await saveRecord(center, currentAddress, selectedImageFile, comment);
      
      // モーダルを閉じて、フォームをリセット
      setShowRecordModal(false);
      setSelectedImageFile(null);
      setSelectedImagePreview(null);
      setComment('');
      
      alert('記録を保存しました！');
      
      // 記録リストを再取得
      const userRecords = await fetchUserRecords();
      setRecords(userRecords);
    } catch (error) {
      console.error('記録の保存に失敗しました:', error);
      alert('記録の保存に失敗しました。もう一度お試しください。');
    }
  };

  // キャンセル確認の処理
  const handleCancelClick = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmCancel = () => {
    setShowRecordModal(false);
    setShowConfirmDialog(false);
    setSelectedImageFile(null);
    setSelectedImagePreview(null);
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

  // マーカークリック時の処理
  const handleMarkerClick = (record: TravelRecord) => {
    setSelectedRecord(record);
  };

  // InfoWindowを閉じる処理
  const handleInfoWindowClose = () => {
    setSelectedRecord(null);
  };

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

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
      <Map
        defaultCenter={center}
        defaultZoom={15}
        disableDefaultUI={true}
        ref={mapRef}
      >
        {!isLoading && <Marker position={center} />}
        
        {/* 記録されたマーカーを表示 */}
        {records.map((record) => (
          <Marker
            key={record.id}
            position={record.location}
            onClick={() => handleMarkerClick(record)}
            icon={{
              url: "data:image/svg+xml;base64," + btoa(`
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="40" height="40">
                  <ellipse cx="256" cy="350" rx="80" ry="60" fill="#d9cf8d"/>
                  <ellipse cx="180" cy="200" rx="40" ry="50" fill="#d9cf8d"/>
                  <ellipse cx="256" cy="160" rx="40" ry="50" fill="#d9cf8d"/>
                  <ellipse cx="332" cy="200" rx="40" ry="50" fill="#d9cf8d"/>
                  <ellipse cx="380" cy="280" rx="35" ry="45" fill="#d9cf8d"/>
                  <ellipse cx="132" cy="280" rx="35" ry="45" fill="#d9cf8d"/>
                  <ellipse cx="256" cy="355" rx="70" ry="50" fill="#c7bc73" opacity="0.7"/>
                  <ellipse cx="180" cy="205" rx="30" ry="40" fill="#c7bc73" opacity="0.7"/>
                  <ellipse cx="256" cy="165" rx="30" ry="40" fill="#c7bc73" opacity="0.7"/>
                  <ellipse cx="332" cy="205" rx="30" ry="40" fill="#c7bc73" opacity="0.7"/>
                  <ellipse cx="380" cy="285" rx="25" ry="35" fill="#c7bc73" opacity="0.7"/>
                  <ellipse cx="132" cy="285" rx="25" ry="35" fill="#c7bc73" opacity="0.7"/>
                </svg>
              `),
              scaledSize: new google.maps.Size(40, 40),
            }}
          />
        ))}

        {/* InfoWindow（記録詳細のポップアップ） */}
        {selectedRecord && (
          <InfoWindow
            position={selectedRecord.location}
            onCloseClick={handleInfoWindowClose}
          >
            <div className={styles.infoWindow}>
              <img 
                src={selectedRecord.imageUrl} 
                alt="記録画像" 
                className={styles.infoWindowImage}
              />
              <div className={styles.infoWindowDate}>
                {formatDateTime(selectedRecord.timestamp)}
              </div>
            </div>
          </InfoWindow>
        )}
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
                {selectedImagePreview ? (
                  <img src={selectedImagePreview} alt="選択された画像" className={styles.selectedImage} />
                ) : (
                  <div className={styles.imagePlaceholder}>
                    <span>画像を選択 / 撮影</span>
                  </div>
                )}
              </label>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageChange}
                className={styles.hiddenInput}
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
              />
            </div>

            {/* 保存ボタン */}
            <button 
              onClick={handleSaveRecord} 
              className={styles.saveButton}
              disabled={recordLoading}
            >
              {recordLoading ? '保存中...' : '記録を保存'}
            </button>

            {/* キャンセルボタン（赤い正円） */}
            <button onClick={handleCancelClick} className={styles.cancelButton}>
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