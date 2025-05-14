import { db } from '../firebaseInit';
import { ON_CALL_COLLECTION } from '../config';

export async function getCollectionDocs<T>(collectionName: string): Promise<T[]> {
  const snapshot = await db.collection(collectionName).get();
  const docsList: T[] = [];
  snapshot.forEach(doc => {
    const docData = doc.data() as T;
    // Assuming your documents should have an 'id' field matching the Firestore doc ID
    (docData as any).id = doc.id; 
    docsList.push(docData);
  });
  return docsList;
}

export async function getDocById<T>(collectionName: string, docId: string): Promise<T | null> {
  const docRef = db.collection(collectionName).doc(docId);
  const doc = await docRef.get();
  if (doc.exists) {
    const docData = doc.data() as T;
    (docData as any).id = doc.id;
    return docData;
  }
  return null;
}

export async function setDocById(collectionName: string, docId: string, data: any): Promise<void> {
  // Exclude 'id' field if present in data, as it's the document ID itself
  const dataToSet = { ...data };
  delete dataToSet.id;
  await db.collection(collectionName).doc(docId).set(dataToSet);
}

export async function addDoc(collectionName: string, data: any): Promise<string> {
  // Exclude 'id' field if present, as Firestore will generate it
  const dataToAdd = { ...data };
  delete dataToAdd.id;
  const docRef = await db.collection(collectionName).add(dataToAdd);
  return docRef.id;
}

export async function updateDocById(collectionName: string, docId: string, dataToUpdate: any): Promise<void> {
   // Exclude 'id' field if present in data, as it's the document ID itself
  const dataToSend = { ...dataToUpdate };
  delete dataToSend.id;
  await db.collection(collectionName).doc(docId).update(dataToSend);
}

export async function deleteDocById(collectionName: string, docId: string): Promise<void> {
  await db.collection(collectionName).doc(docId).delete();
}

// Specific utility for On-Call config (assuming a single doc)
export async function getOnCallConfig(): Promise<any> {
  const doc = await getDocById(ON_CALL_COLLECTION, "current");
  if (doc) {
    return doc;
  }
  // Default if not found, and create it
  const defaultConfig = { current_on_call_index: 0, rotation_order: [] };
  await setDocById(ON_CALL_COLLECTION, "current", defaultConfig);
  return { ...defaultConfig, id: "current" }; // Add id for consistency
}

export async function saveOnCallConfig(data: any): Promise<void> {
  await setDocById(ON_CALL_COLLECTION, "current", data);
}