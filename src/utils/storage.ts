import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Language } from '../types';

interface AppDB extends DBSchema {
  settings: {
    key: string;
    value: {
      key: string;
      value: string | number;
      updatedAt: number;
    };
  };
  cache: {
    key: string;
    value: {
      key: string;
      data: unknown;
      expireAt: number;
    };
  };
}

let dbInstance: IDBPDatabase<AppDB> | null = null;

async function getDB(): Promise<IDBPDatabase<AppDB>> {
  if (dbInstance) return dbInstance;
  
  dbInstance = await openDB<AppDB>('leetcode-84-db', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('cache')) {
        db.createObjectStore('cache', { keyPath: 'key' });
      }
    },
  });
  
  return dbInstance;
}

// 保存设置
export async function saveSetting(key: string, value: string | number): Promise<void> {
  const db = await getDB();
  await db.put('settings', {
    key,
    value,
    updatedAt: Date.now(),
  });
}

// 获取设置
export async function getSetting<T extends string | number>(key: string, defaultValue: T): Promise<T> {
  try {
    const db = await getDB();
    const result = await db.get('settings', key);
    return (result?.value as T) ?? defaultValue;
  } catch {
    return defaultValue;
  }
}

// 保存缓存（带过期时间）
export async function setCache(key: string, data: unknown, ttlMs: number): Promise<void> {
  const db = await getDB();
  await db.put('cache', {
    key,
    data,
    expireAt: Date.now() + ttlMs,
  });
}

// 获取缓存
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const db = await getDB();
    const result = await db.get('cache', key);
    if (!result) return null;
    if (Date.now() > result.expireAt) {
      await db.delete('cache', key);
      return null;
    }
    return result.data as T;
  } catch {
    return null;
  }
}

// 获取缓存（即使过期也返回）
export async function getCacheEvenExpired<T>(key: string): Promise<T | null> {
  try {
    const db = await getDB();
    const result = await db.get('cache', key);
    return result?.data as T ?? null;
  } catch {
    return null;
  }
}

// 语言设置
export async function saveLanguage(lang: Language): Promise<void> {
  await saveSetting('selectedLanguage', lang);
}

export async function getLanguage(): Promise<Language> {
  return getSetting<Language>('selectedLanguage', 'java');
}

// 播放速度设置
export async function savePlaybackSpeed(speed: number): Promise<void> {
  await saveSetting('playbackSpeed', speed);
}

export async function getPlaybackSpeed(): Promise<number> {
  return getSetting<number>('playbackSpeed', 1);
}
