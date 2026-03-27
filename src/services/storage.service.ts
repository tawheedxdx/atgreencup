import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../lib/firebase';

export interface UploadResult {
  url: string;
  path: string;
}

export const uploadEntryImage = (
  entryId: string,
  file: File,
  onProgress?: (pct: number) => void
): Promise<UploadResult> => {
  return new Promise((resolve, reject) => {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `entries/${entryId}/image.${ext}`;
    const storageRef = ref(storage, path);
    const task = uploadBytesResumable(storageRef, file);

    task.on(
      'state_changed',
      snap => {
        const pct = (snap.bytesTransferred / snap.totalBytes) * 100;
        onProgress?.(pct);
      },
      reject,
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve({ url, path });
      }
    );
  });
};

export const deleteEntryImage = async (path: string): Promise<void> => {
  if (!path) return;
  try {
    await deleteObject(ref(storage, path));
  } catch {
    // Silently handle if image already deleted
  }
};
