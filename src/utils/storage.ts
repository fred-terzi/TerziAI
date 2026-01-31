/**
 * IndexedDB utilities for persistent storage
 * Stores chat history locally in the browser
 */

import type { ChatMessage } from '../types/chat';

const DB_NAME = 'TerziAI';
const DB_VERSION = 1;
const MESSAGES_STORE = 'messages';
const DB_TIMEOUT_MS = 10000; // 10 second timeout for database operations

// Track ongoing operations to prevent concurrent access issues
let operationInProgress = false;
const operationQueue: Array<() => Promise<void>> = [];

/**
 * Check if IndexedDB is available
 */
function isIndexedDBAvailable(): boolean {
  return typeof indexedDB !== 'undefined';
}

/**
 * Execute database operation with timeout and queueing
 */
async function withDatabaseOperation<T>(operation: () => Promise<T>): Promise<T> {
  // Queue operations to prevent concurrent access
  if (operationInProgress) {
    await new Promise<void>((resolve) => {
      operationQueue.push(async () => resolve());
    });
  }

  operationInProgress = true;
  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Database operation timeout')), DB_TIMEOUT_MS);
    });

    const result = await Promise.race([operation(), timeoutPromise]);
    return result;
  } finally {
    operationInProgress = false;
    // Process next queued operation
    const nextOperation = operationQueue.shift();
    if (nextOperation) {
      nextOperation();
    }
  }
}

/**
 * Open or create the IndexedDB database with timeout
 */
function openDatabase(): Promise<IDBDatabase> {
  if (!isIndexedDBAvailable()) {
    return Promise.reject(new Error('IndexedDB not available'));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    // Add timeout for open request
    const timeout = setTimeout(() => {
      reject(new Error('Database open timeout'));
    }, DB_TIMEOUT_MS);

    request.onerror = () => {
      clearTimeout(timeout);
      reject(request.error);
    };
    request.onsuccess = () => {
      clearTimeout(timeout);
      resolve(request.result);
    };

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
 * Save chat messages to IndexedDB with atomic transaction
 */
export async function saveMessages(messages: ChatMessage[]): Promise<void> {
  if (!isIndexedDBAvailable()) {
    return; // Silently skip in environments without IndexedDB
  }

  return withDatabaseOperation(async () => {
    let db: IDBDatabase | null = null;
    try {
      db = await openDatabase();
      const transaction = db.transaction([MESSAGES_STORE], 'readwrite');
      const store = transaction.objectStore(MESSAGES_STORE);

      // Clear existing messages first
      await new Promise<void>((resolve, reject) => {
        const clearRequest = store.clear();
        clearRequest.onsuccess = () => resolve();
        clearRequest.onerror = () => reject(clearRequest.error);
      });

      // Add all messages in a single atomic transaction
      const addPromises = messages.map((message) => {
        const storableMessage = {
          ...message,
          timestamp: message.timestamp.toISOString(),
        };
        return new Promise<void>((resolve, reject) => {
          try {
            const addRequest = store.add(storableMessage);
            addRequest.onsuccess = () => resolve();
            addRequest.onerror = () => {
              // Handle quota exceeded error
              if (addRequest.error?.name === 'QuotaExceededError') {
                reject(new Error('Storage quota exceeded. Please clear old messages.'));
              } else {
                reject(addRequest.error);
              }
            };
          } catch (err) {
            // Catch synchronous errors like QuotaExceededError
            if (err instanceof DOMException && err.name === 'QuotaExceededError') {
              reject(new Error('Storage quota exceeded. Please clear old messages.'));
            } else {
              reject(err);
            }
          }
        });
      });

      // Wait for all adds to complete
      await Promise.all(addPromises);

      // Wait for transaction to complete
      await new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(new Error('Transaction aborted'));
      });
    } catch (error) {
      console.error('Failed to save messages:', error);
      // Re-throw quota errors so they can be handled by the UI
      if (error instanceof Error && error.message.includes('quota')) {
        throw error;
      }
      // Other errors fail gracefully
    } finally {
      if (db) {
        db.close();
      }
    }
  });
}

/**
 * Load chat messages from IndexedDB
 */
export async function loadMessages(): Promise<ChatMessage[]> {
  if (!isIndexedDBAvailable()) {
    return []; // Return empty array in environments without IndexedDB
  }

  return withDatabaseOperation(async () => {
    let db: IDBDatabase | null = null;
    try {
      db = await openDatabase();
      const transaction = db.transaction([MESSAGES_STORE], 'readonly');
      const store = transaction.objectStore(MESSAGES_STORE);
      const request = store.getAll();

      const messages = await new Promise<ChatMessage[]>((resolve, reject) => {
        request.onsuccess = () => {
          // Convert ISO strings back to Date objects
          const messages = request.result.map(
            (msg: {
              id: string;
              role: 'user' | 'assistant' | 'system';
              content: string;
              timestamp: string;
            }) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            })
          );
          resolve(messages);
        };
        request.onerror = () => reject(request.error);
      });

      return messages;
    } catch (error) {
      console.error('Failed to load messages:', error);
      return [];
    } finally {
      if (db) {
        db.close();
      }
    }
  });
}

/**
 * Clear all chat messages from IndexedDB
 */
export async function clearMessages(): Promise<void> {
  if (!isIndexedDBAvailable()) {
    return; // Silently skip in environments without IndexedDB
  }

  return withDatabaseOperation(async () => {
    let db: IDBDatabase | null = null;
    try {
      db = await openDatabase();
      const transaction = db.transaction([MESSAGES_STORE], 'readwrite');
      const store = transaction.objectStore(MESSAGES_STORE);

      await new Promise<void>((resolve, reject) => {
        const clearRequest = store.clear();
        clearRequest.onsuccess = () => resolve();
        clearRequest.onerror = () => reject(clearRequest.error);
      });

      // Wait for transaction to complete
      await new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(new Error('Transaction aborted'));
      });
    } catch (error) {
      console.error('Failed to clear messages:', error);
      // Don't throw - fail gracefully
    } finally {
      if (db) {
        db.close();
      }
    }
  });
}
