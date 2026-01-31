/**
 * IndexedDB utilities for persistent storage
 * Stores chat history locally in the browser
 */

import type { ChatMessage } from '../types/chat';

const DB_NAME = 'TerziAI';
const DB_VERSION = 1;
const MESSAGES_STORE = 'messages';

/**
 * Check if IndexedDB is available
 */
function isIndexedDBAvailable(): boolean {
  return typeof indexedDB !== 'undefined';
}

/**
 * Open or create the IndexedDB database
 */
function openDatabase(): Promise<IDBDatabase> {
  if (!isIndexedDBAvailable()) {
    return Promise.reject(new Error('IndexedDB not available'));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create messages store if it doesn't exist
      if (!db.objectStoreNames.contains(MESSAGES_STORE)) {
        db.createObjectStore(MESSAGES_STORE, { keyPath: 'id' });
      }
    };
  });
}

/**
 * Save chat messages to IndexedDB
 */
export async function saveMessages(messages: ChatMessage[]): Promise<void> {
  if (!isIndexedDBAvailable()) {
    return; // Silently skip in environments without IndexedDB
  }

  try {
    const db = await openDatabase();
    const transaction = db.transaction([MESSAGES_STORE], 'readwrite');
    const store = transaction.objectStore(MESSAGES_STORE);

    // Clear existing messages
    store.clear();

    // Add all messages
    for (const message of messages) {
      // Convert Date to ISO string for storage
      const storableMessage = {
        ...message,
        timestamp: message.timestamp.toISOString(),
      };
      store.add(storableMessage);
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      transaction.onerror = () => {
        db.close();
        reject(transaction.error);
      };
    });
  } catch (error) {
    console.error('Failed to save messages:', error);
    // Don't throw - fail gracefully
  }
}

/**
 * Load chat messages from IndexedDB
 */
export async function loadMessages(): Promise<ChatMessage[]> {
  if (!isIndexedDBAvailable()) {
    return []; // Return empty array in environments without IndexedDB
  }

  try {
    const db = await openDatabase();
    const transaction = db.transaction([MESSAGES_STORE], 'readonly');
    const store = transaction.objectStore(MESSAGES_STORE);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        db.close();
        // Convert ISO strings back to Date objects
        const messages = request.result.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        resolve(messages);
      };
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Failed to load messages:', error);
    return [];
  }
}

/**
 * Clear all chat messages from IndexedDB
 */
export async function clearMessages(): Promise<void> {
  if (!isIndexedDBAvailable()) {
    return; // Silently skip in environments without IndexedDB
  }

  try {
    const db = await openDatabase();
    const transaction = db.transaction([MESSAGES_STORE], 'readwrite');
    const store = transaction.objectStore(MESSAGES_STORE);
    store.clear();

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      transaction.onerror = () => {
        db.close();
        reject(transaction.error);
      };
    });
  } catch (error) {
    console.error('Failed to clear messages:', error);
    // Don't throw - fail gracefully
  }
}
