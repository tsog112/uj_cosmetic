export function uploadProductImage(
  file: File,
  productSlug: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload', true);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress?.(progress);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          if (response.url) {
            resolve(response.url);
          } else {
            console.error('[uploadImage] Server returned no URL:', response);
            reject(new Error(response.error || 'No URL returned'));
          }
        } catch (e) {
          console.error('[uploadImage] Could not parse response:', xhr.responseText);
          reject(new Error('Invalid response'));
        }
      } else {
        // Log the actual server error so we can debug it
        try {
          const errBody = JSON.parse(xhr.responseText);
          console.error(`[uploadImage] HTTP ${xhr.status} from /api/upload:`, errBody);
          reject(new Error(errBody.error || `HTTP ${xhr.status}`));
        } catch {
          console.error(`[uploadImage] HTTP ${xhr.status} raw:`, xhr.responseText);
          reject(new Error(`HTTP ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send(formData);
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
