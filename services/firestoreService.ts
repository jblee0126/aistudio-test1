
import { toFirestoreDocument, fromFirestoreDocument } from '../utils/firestoreHelper';

// Configuration
const PROJECT_ID = 'okr-platform-477800'; // Updated Project ID
const DATABASE_ID = 'okr-mock'; // Updated Database ID
const API_KEY = process.env.API_KEY; // Needs to be set in environment
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents`;

// URL Helpers
// pageSize is only valid for GET (List) requests
const getListUrl = (collection: string) => `${BASE_URL}/${collection}?key=${API_KEY}&pageSize=300`;
// Base URL for POST (Create) requests - must NOT have pageSize
const getBaseUrl = (collection: string) => `${BASE_URL}/${collection}?key=${API_KEY}`;
// URL for specific documents (GET, PATCH, DELETE)
const getDocUrl = (collection: string, id: string) => `${BASE_URL}/${collection}/${id}?key=${API_KEY}`;

/**
 * Generic Fetch All
 */
export const fetchCollection = async <T>(collection: string): Promise<T[]> => {
  try {
    // Use getListUrl here to include pageSize
    const response = await fetch(getListUrl(collection));
    if (!response.ok) {
        // Throw error to trigger fallback in App.tsx if permission denied or other error
        throw new Error(`Failed to fetch ${collection}: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    if (!data.documents) return [];
    
    return data.documents.map(fromFirestoreDocument) as T[];
  } catch (error) {
    console.error(`Error fetching ${collection}:`, error);
    throw error; // Propagate error so App can handle fallback
  }
};

/**
 * Generic Create (POST)
 * Note: Firestore REST API uses POST to parent collection to create auto-ID, 
 * or expects a query param `documentId` if we want to specify ID.
 */
export const createDocument = async <T extends { id?: string }>(collection: string, data: T): Promise<T> => {
  try {
    const docData = toFirestoreDocument(data);
    // Use getBaseUrl here to avoid sending pageSize which causes 400 BAD REQUEST
    let url = getBaseUrl(collection);
    
    // If data has an ID, use it.
    if (data.id) {
        url = `${getBaseUrl(collection)}&documentId=${data.id}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(docData),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Failed to create document: ${err}`);
    }

    const resultDoc = await response.json();
    return fromFirestoreDocument(resultDoc) as T;
  } catch (error) {
    console.error(`Error creating in ${collection}:`, error);
    throw error;
  }
};

/**
 * Generic Update (PATCH)
 */
export const updateDocument = async <T>(collection: string, id: string, data: Partial<T>): Promise<void> => {
  try {
    const docData = toFirestoreDocument(data);
    // We need to specify an update mask to only update provided fields, 
    // BUT for simplicity in this app, we often update the whole object structure or nested arrays.
    // A simple PATCH without mask updates the specified fields and merges.
    // To replace fields or update nested maps correctly via REST is complex.
    // Strategy: We will send the known fields. 
    // Warning: Arrays in Firestore replace the entire array.
    
    // Construct query params for updateMask if needed, but for now we rely on merge behavior for top-level keys.
    // For deeply nested updates (like modifying one KR in an array), we usually have to send the WHOLE array back.
    
    const fieldPaths = Object.keys(data).map(k => `updateMask.fieldPaths=${k}`).join('&');
    const url = `${getDocUrl(collection, id)}&${fieldPaths}`;

    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(docData),
    });

    if (!response.ok) {
         const err = await response.text();
         throw new Error(`Failed to update document: ${err}`);
    }
  } catch (error) {
    console.error(`Error updating ${collection}/${id}:`, error);
    throw error;
  }
};

/**
 * Generic Delete
 */
export const deleteDocument = async (collection: string, id: string): Promise<void> => {
  try {
    const response = await fetch(getDocUrl(collection, id), {
      method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Failed to delete document');
    }
  } catch (error) {
    console.error(`Error deleting ${collection}/${id}:`, error);
    throw error;
  }
};

/**
 * Special helper for Batch seeding
 * Firestore REST doesn't have a simple "Batch Write" endpoint like the SDK.
 * We have to use `commit`.
 */
export const seedBatch = async (collection: string, items: any[]) => {
    // Doing sequential writes for simplicity as Commit API is verbose
    for (const item of items) {
        await createDocument(collection, item);
    }
};