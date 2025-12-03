
import { Type } from "@google/genai";

// Types for Firestore REST JSON format
type FirestoreValue = 
  | { stringValue: string }
  | { integerValue: string | number }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { mapValue: { fields: Record<string, FirestoreValue> } }
  | { arrayValue: { values: FirestoreValue[] } }
  | { timestampValue: string }
  | { nullValue: null };

export const toFirestoreValue = (value: any): FirestoreValue => {
  if (value === null || value === undefined) {
    return { nullValue: null };
  }
  if (typeof value === 'string') {
    // Check if it looks like a date and preserve it as string if it's not an ISO date
    // Firestore timestamp expects RFC 3339. For simplicity in this app, we store dates as strings (ISO)
    // or we could map specific keys. Let's stick to stringValue for ISO dates to match Interface.
    return { stringValue: value };
  }
  if (typeof value === 'number') {
    return Number.isInteger(value) 
      ? { integerValue: value } 
      : { doubleValue: value };
  }
  if (typeof value === 'boolean') {
    return { booleanValue: value };
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(toFirestoreValue) } };
  }
  if (typeof value === 'object') {
    // Handle Date objects
    if (value instanceof Date) {
        return { stringValue: value.toISOString() };
    }
    const fields: Record<string, FirestoreValue> = {};
    for (const k in value) {
      if (Object.prototype.hasOwnProperty.call(value, k)) {
        fields[k] = toFirestoreValue(value[k]);
      }
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(value) };
};

export const fromFirestoreValue = (value: FirestoreValue): any => {
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return Number(value.doubleValue);
  if ('booleanValue' in value) return value.booleanValue;
  if ('timestampValue' in value) return value.timestampValue;
  if ('nullValue' in value) return null;
  if ('mapValue' in value) {
    const obj: any = {};
    const fields = value.mapValue.fields || {};
    for (const k in fields) {
      obj[k] = fromFirestoreValue(fields[k]);
    }
    return obj;
  }
  if ('arrayValue' in value) {
    return (value.arrayValue.values || []).map(fromFirestoreValue);
  }
  return undefined;
};

export const toFirestoreDocument = (data: any) => {
  const fields: Record<string, FirestoreValue> = {};
  for (const key in data) {
    if (key !== 'id') { // Don't store ID inside the fields if it's the document ID
        fields[key] = toFirestoreValue(data[key]);
    }
  }
  return { fields };
};

export const fromFirestoreDocument = (doc: any): any => {
  const data = fromFirestoreValue({ mapValue: { fields: doc.fields } });
  // Extract ID from document name: "projects/.../documents/collection/DOC_ID"
  const idPath = doc.name.split('/');
  data.id = idPath[idPath.length - 1];
  return data;
};
