'use client';
import React, { useEffect, useState, useRef } from 'react';
import styles from "./Googlemap.module.css";
import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';
import NavigationIcon from './paper-plane-solid.svg';
import RecordIcon from './plus-solid.svg';

export const MapContent = () => {
  const [center, setCenter] = useState({ lat: 35.656, lng: 139.737 }); // 緯度・経度の設定（初期値は東京）
  const [isLoading, setIsLoading] = useState(true);// ローディング状態の管理
  const mapRef = useRef<google.maps.Map | null>(null);// マップの参照を保持するためのuseRef

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos ={
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCenter(pos);
          setIsLoading(false);
          mapRef.current?.panTo(pos)// 現在地にマップを移動
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



  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
      {/*Google Mapsの表示*/}
        <Map
        defaultCenter={center}
        defaultZoom={15}
        disableDefaultUI={true}
        >
        {!isLoading && <Marker position={center} />}
        </Map>
     {/* 現在地ボタン */}
        <button
          onClick={goToCurrentLocation}
          className={styles.currentwarp}
        >
        <NavigationIcon className={styles.navIcon} />
        </button> 
        <button
        className={styles.recordmenu}
        >
        <RecordIcon className={styles.plusIcon} />
        </button>
    </APIProvider>
  );
};
export default MapContent;