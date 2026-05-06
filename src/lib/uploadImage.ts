import { storage } from './firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

export async function uploadProductImage(
  file: File,
  productSlug: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  const timestamp = Date.now();
  const filename = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
  const storageRef = ref(storage, `products/${productSlug}/${filename}`);
  
  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(Math.round(progress));
      },
      (error) => {
        console.error('Upload error:', error);
        reject(new Error('Зураг оруулахад алдаа гарлаа'));
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadURL);
      }
    );
  });
}

export async function uploadMultipleImages(
  files: File[],
  productSlug: string,
  onProgress?: (fileIndex: number, progress: number) => void
): Promise<string[]> {
  const urls: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const url = await uploadProductImage(
      files[i],
      productSlug,
      (progress) => onProgress?.(i, progress)
    );
    urls.push(url);
  }
  return urls;
}
