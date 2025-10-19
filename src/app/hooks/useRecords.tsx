'use client';
import { useState } from 'react';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAuth } from './useAuth';

export interface TravelRecord {
  id?: string;
  userId: string;
  location: {
    lat: number;
    lng: number;
  };
  address: string;
  imageUrl: string;
  comment: string;
  timestamp: string;
}

export const useRecords = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // 画像をFirebase Storageにアップロード
  const uploadImage = async (file: File): Promise<string> => {
    if (!user) throw new Error('ユーザーがログインしていません');
    
    const timestamp = Date.now();
    const fileName = `${user.uid}/${timestamp}_${file.name}`;
    const storageRef = ref(storage, `travel-images/${fileName}`);
    
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  };

  // 記録を保存
  const saveRecord = async (
    location: { lat: number; lng: number },
    address: string,
    image: File,
    comment: string
  ): Promise<void> => {
    if (!user) throw new Error('ユーザーがログインしていません');
    
    setLoading(true);
    try {
      // 画像をアップロード
      const imageUrl = await uploadImage(image);
      
      // Firestoreに記録を保存
      const recordData: Omit<TravelRecord, 'id'> = {
        userId: user.uid,
        location,
        address,
        imageUrl,
        comment,
        timestamp: new Date().toISOString()
      };
      
      await addDoc(collection(db, 'records'), recordData);
    } catch (error) {
      console.error('記録の保存に失敗しました:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ユーザーの記録を取得
  const fetchUserRecords = async (): Promise<TravelRecord[]> => {
    if (!user) return [];
    
    setLoading(true);
    try {
      const q = query(
        collection(db, 'records'),
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const records: TravelRecord[] = [];
      
      querySnapshot.forEach((doc) => {
        records.push({
          id: doc.id,
          ...doc.data()
        } as TravelRecord);
      });
      
      return records;
    } catch (error) {
      console.error('記録の取得に失敗しました:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    saveRecord,
    fetchUserRecords
  };
};