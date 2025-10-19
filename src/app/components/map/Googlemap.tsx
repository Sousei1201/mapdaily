'use client';
import React, { useEffect, useState, useRef } from 'react';
import styles from "./Googlemap.module.css";
import { APIProvider, Map, AdvancedMarker, Pin} from '@vis.gl/react-google-maps';
import NavigationIcon from './paper-plane-solid.svg';
import RecordIcon from './plus-solid.svg';
import { useAuth } from '../../hooks/useAuth';
import { storage, db } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, onSnapshot, query, where, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import PawIcon from './paw-solid.svg';


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
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);
  const [showRecordDetail, setShowRecordDetail] = useState(false);
  const [detailRecord, setDetailRecord] = useState<RecordData | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editComment, setEditComment] = useState('');
  const [editImage, setEditImage] = useState<string | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [showConfirmCancelEdit, setShowConfirmCancelEdit] = useState(false);
  const [showConfirmDeleteRecord, setShowConfirmDeleteRecord] = useState(false);
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
        id: doc.id,  
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
  const getCurrentAddress = async (lat: number, lng: number): Promise<string> => {
    try {
      const geocoder = new google.maps.Geocoder();
      const response = await new Promise<string>((resolve, reject) => {
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
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
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file); // File オブジェクトを保存
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setSelectedImage(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // 画像をFirebase Storageにアップロードする関数
  const uploadImageToStorage = async (file: File, userId: string): Promise<string> => {
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
      const saveRecordToFirestore = async (recordData: Omit<RecordData, 'id'>) => {
        const docRef = await addDoc(collection(db, `travel-records`), recordData);
        return docRef.id;
      };

      const newRecordData: Omit<RecordData, 'id'> = {
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



      const newId = await saveRecordToFirestore(newRecordData);

      const newRecord: RecordData = {
        ...newRecordData,
        id: newId
      };
    

      // id を埋めてから state に追加すると key 重複が防げる
      setRecords((prev) => [...prev, { ...newRecord, id: newId }]);

      console.log(newRecord);

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
      const errorCode = (error as { code?: string })?.code;
      const errorMessage = (error as { message?: string })?.message;
      if (errorCode === 'storage/unauthorized') {
        alert(`画像のアップロード権限がありません。ログインを確認してください。\nユーザーID: ${user?.uid}\nエラー: ${errorMessage}`);
      } else if (errorCode === 'permission-denied') {
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

 // 肉球ピンクリック時の処理（詳細表示）
  const handleRecordMarkerClick = (record: RecordData) => {
    // ホバーポップアップを閉じる
    setShowPopup(false);
    setSelectedRecord(null);
    setPopupPosition(null);

    setDetailRecord(record);
    setShowRecordDetail(true);
  };

  // タッチデバイスかどうかを判定
  const isTouchDevice = () => {
    return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  };

  // 肉球ピンホバーの処理
  const handleRecordMarkerHover = (record : RecordData, event: { domEvent?: Event }) => {
    // タッチデバイス（スマホ・タブレット）ではホバー処理をスキップ
    if (isTouchDevice()) {
      return;
    }

    // ピンの中央座標を取得
    const target = event.domEvent?.target as HTMLElement;
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // 先にポジションを設定
    setPopupPosition({
      x: centerX,
      y: centerY
    });
    setSelectedRecord(record);
    setShowPopup(true);
  };

  console.log(records)

  // ポップアップを閉じる処理
  const handleRecordMarkerLeave = () => {
    setShowPopup(false);
    setSelectedRecord(null);
    setPopupPosition(null);
  };

  // 詳細画面を閉じる処理
  const handleCloseDetail = () => {
    if (isEditMode) {
      setShowConfirmCancelEdit(true);
    } else {
      setShowRecordDetail(false);
      setDetailRecord(null);
    }
  };

  // 編集モードに入る
  const handleStartEdit = () => {
    if (detailRecord) {
      setEditComment(detailRecord.comment);
      setEditImage(detailRecord.image);
      setEditImageFile(null);
      setIsEditMode(true);
    }
  };

  // 編集をキャンセル
  const handleCancelEdit = () => {
    setShowConfirmCancelEdit(false);
    setIsEditMode(false);
    setShowRecordDetail(false);
    setDetailRecord(null);
    setEditComment('');
    setEditImage(null);
    setEditImageFile(null);
  };

  // 編集キャンセルを取り消し
  const handleKeepEditing = () => {
    setShowConfirmCancelEdit(false);
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
    if (!detailRecord || !user) return;

    setUploading(true);

    try {
      let imageURL = editImage;

      // 新しい画像がある場合はアップロード
      if (editImageFile) {
        imageURL = await uploadImageToStorage(editImageFile, user.uid);
      }

      const recordRef = doc(db, 'travel-records', detailRecord.id);
      await updateDoc(recordRef, {
        comment: editComment,
        image: imageURL
      });
      alert('記録を更新しました');
      setIsEditMode(false);
      setShowRecordDetail(false);
      setDetailRecord(null);
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
    setShowConfirmDeleteRecord(true);
  };

  // 削除をキャンセル
  const handleCancelDelete = () => {
    setShowConfirmDeleteRecord(false);
  };

  // 記録を削除
  const handleDeleteRecord = async () => {
    if (!detailRecord) return;

    try {
      const recordRef = doc(db, 'travel-records', detailRecord.id);
      await deleteDoc(recordRef);
      alert('記録を削除しました');
      setShowConfirmDeleteRecord(false);
      setIsEditMode(false);
      setShowRecordDetail(false);
      setDetailRecord(null);
      setEditComment('');
    } catch (error) {
      console.error('削除エラー:', error);
      alert('記録の削除に失敗しました');
    }
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

  //マーカーピンのオプション
  const PawPinOptions = {
    background: '#82ae46',
    borderColor: '#6d9139',
    glyphColor: '#82ae46',
  };

   const PinOptions = {
    background: '#ffec47',
    borderColor: '#6d9139',
    glyphColor: '#82ae46',
  };

  // 肉球アイコンコンポーネント
  // const PawIcon = () => (
  //   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="40" height="40">
  //     <ellipse cx="256" cy="350" rx="80" ry="60" fill="#d9cf8d"/>
  //     <ellipse cx="180" cy="200" rx="40" ry="50" fill="#d9cf8d"/>
  //     <ellipse cx="256" cy="160" rx="40" ry="50" fill="#d9cf8d"/>
  //     <ellipse cx="332" cy="200" rx="40" ry="50" fill="#d9cf8d"/>
  //     <ellipse cx="380" cy="280" rx="35" ry="45" fill="#d9cf8d"/>
  //     <ellipse cx="132" cy="280" rx="35" ry="45" fill="#d9cf8d"/>
  //     <ellipse cx="256" cy="355" rx="70" ry="50" fill="#c7bc73" opacity="0.7"/>
  //     <ellipse cx="180" cy="205" rx="30" ry="40" fill="#c7bc73" opacity="0.7"/>
  //     <ellipse cx="256" cy="165" rx="30" ry="40" fill="#c7bc73" opacity="0.7"/>
  //     <ellipse cx="332" cy="205" rx="30" ry="40" fill="#c7bc73" opacity="0.7"/>
  //     <ellipse cx="380" cy="285" rx="25" ry="35" fill="#c7bc73" opacity="0.7"/>
  //     <ellipse cx="132" cy="285" rx="25" ry="35" fill="#c7bc73" opacity="0.7"/>
  //   </svg>
  // ); 

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
            mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID}
          >
         {/* 現在地マーカー */}
          <AdvancedMarker position={center}>
            <Pin {...PinOptions}
            />
          </AdvancedMarker> 
          {/* 記録された場所の肉球ピン */}
          {records.map((record) => (
            <AdvancedMarker
              key={`${record.id}-${record.location.lat}-${record.location.lng}`}
              position={record.location}
              onClick={() => handleRecordMarkerClick(record)}
              onMouseEnter={(e) => handleRecordMarkerHover(record, e as { domEvent?: Event })}
              onMouseLeave={handleRecordMarkerLeave}

            >
              <div className={styles.pawMarkerWrapper}>
               <Pin {...PawPinOptions}>
                <div className={styles.pawIconContainer}>
                  <PawIcon/>

                </div>
               </Pin>
              </div>
            </AdvancedMarker>
 
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
      {/* 記録ポップアップ（ホバー表示） */}
      {showPopup && selectedRecord && popupPosition &&(
        <div
        className={styles.hoverPopup}
        style={{
          left: `${popupPosition.x}px`,
          top: `${popupPosition.y - 20}px`, // ピンの上に表示（20pxは調整値）
          transform: 'translate(-50%, -100%)' // 中央揃え + 上に配置
        }}
        onMouseEnter={() => setShowPopup(true)}
        onMouseLeave={handleRecordMarkerLeave}
        >
          {/* 吹き出しの三角形 */}
          <div className={styles.popupArrow}></div>

          {/* 画像表示 */}
          {selectedRecord.image && (
            <div className={styles.hoverPopupImageContainer}>
              <img
                src={selectedRecord.image}
                alt="記録した画像"
                className={styles.hoverPopupImage}
              />
            </div>
          )}

          {/* 日時表示 */}
          <div className={styles.hoverPopupDateTime}>
            {formatDateTime(selectedRecord.timestamp)}
          </div>

          {/* コメント表示 */}
          {selectedRecord.comment && (
            <div className={styles.hoverPopupComment}>
              {selectedRecord.comment}
            </div>
          )}

          {/* 住所表示 */}
          <div className={styles.hoverPopupAddress}>
            {selectedRecord.address}
          </div>
        </div>
      )}

      {/* 記録詳細モーダル（全画面） */}
      {showRecordDetail && detailRecord && (
        <div className={styles.detailModalOverlay}>
          <div className={styles.detailModalContent}>
            {/* バツボタン */}
            <button
              onClick={handleCloseDetail}
              className={styles.detailCloseButton}
            >
              ×
            </button>

            {/* 画像表示・編集 */}
            {isEditMode ? (
              <div className={styles.detailImageSection}>
                <label htmlFor="edit-image-upload" className={styles.imageUploadLabel}>
                  {editImage ? (
                    <img src={editImage} alt="選択された画像" className={styles.detailSelectedImage} />
                  ) : (
                    <div className={styles.imagePlaceholder}>
                      <span>画像を選択</span>
                    </div>
                  )}
                </label>
                <input
                  id="edit-image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleEditImageChange}
                  className={styles.hiddenInput}
                  disabled={uploading}
                />
              </div>
            ) : (
              detailRecord.image && (
                <div className={styles.detailImageSection}>
                  <img
                    src={detailRecord.image}
                    alt="記録した画像"
                    className={styles.detailSelectedImage}
                  />
                </div>
              )
            )}

            {/* 住所表示 */}
            <div className={styles.detailAddressSection}>
              <label className={styles.detailFieldLabel}>場所</label>
              <div className={styles.detailAddressDisplay}>{detailRecord.address}</div>
            </div>

            {/* 日時表示 */}
            <div className={styles.detailDatetimeSection}>
              <label className={styles.detailFieldLabel}>日時</label>
              <div className={styles.detailDatetimeDisplay}>
                {formatDateTime(detailRecord.timestamp)}
              </div>
            </div>

            {/* コメント表示・編集 */}
            <div className={styles.detailCommentSection}>
              <label className={styles.detailFieldLabel}>コメント</label>
              {isEditMode ? (
                <textarea
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  className={styles.detailCommentInput}
                  placeholder="コメントを入力してください"
                  rows={4}
                  disabled={uploading}
                />
              ) : (
                <div className={styles.detailCommentDisplay}>{detailRecord.comment || 'コメントなし'}</div>
              )}
            </div>

            {/* ボタンエリア */}
            {isEditMode ? (
              <div className={styles.detailButtonContainer}>
                <button
                  onClick={handleUpdateRecord}
                  className={styles.detailSaveButton}
                  disabled={uploading}
                >
                  {uploading ? '保存中...' : '保存'}
                </button>
                <button
                  onClick={handleShowDeleteConfirm}
                  className={styles.detailDeleteButton}
                  disabled={uploading}
                >
                  削除
                </button>
              </div>
            ) : (
              <div className={styles.detailButtonContainer}>
                <button onClick={handleStartEdit} className={styles.detailEditButton}>
                  編集・削除
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 編集キャンセル確認ダイアログ */}
      {showConfirmCancelEdit && (
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
      {showConfirmDeleteRecord && (
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

    </APIProvider>
  );
};

export default MapContent;