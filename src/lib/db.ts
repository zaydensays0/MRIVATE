"use client";

import type { HiddenFile, HiddenFileWithData } from "@/types";

const DB_NAME = "FileCloakerDB";
const STORE_NAME = "hiddenFiles";
const DB_VERSION = 1;

function promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

const getDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("Database error:", request.error);
      reject(new Error("Failed to open DB."));
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };
  });
};

export const addFile = async (file: File): Promise<number> => {
  const db = await getDB();
  const transaction = db.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);

  const fileData = {
    name: file.name,
    type: file.type,
    size: file.size,
    lastModified: file.lastModified,
    data: file,
  };

  return promisifyRequest(store.add(fileData));
};

export const getFiles = async (): Promise<HiddenFile[]> => {
  const db = await getDB();
  const transaction = db.transaction(STORE_NAME, "readonly");
  const store = transaction.objectStore(STORE_NAME);
  const allRecords = await promisifyRequest<HiddenFileWithData[]>(
    store.getAll()
  );

  return allRecords.map(({ data, ...rest }) => rest);
};

export const getFile = async (
  id: number
): Promise<HiddenFileWithData | undefined> => {
  const db = await getDB();
  const transaction = db.transaction(STORE_NAME, "readonly");
  const store = transaction.objectStore(STORE_NAME);
  return promisifyRequest(store.get(id));
};

export const deleteFile = async (id: number): Promise<void> => {
  const db = await getDB();
  const transaction = db.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);
  await promisifyRequest(store.delete(id));
};
