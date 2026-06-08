declare global {
  interface Window {
    Kakao?: {
      isInitialized: () => boolean;
      init: (key: string) => void;
      Auth: {
        login: (options: {
          success: (response: { access_token: string }) => void;
          fail: (error: { error?: string; error_description?: string }) => void;
        }) => void;
      };
    };
  }
}

export function loadKakaoSdk(appKey: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();

  return new Promise((resolve, reject) => {
    const init = () => {
      if (!window.Kakao) {
        reject(new Error('Kakao SDK missing'));
        return;
      }
      if (!window.Kakao.isInitialized()) {
        window.Kakao.init(appKey);
      }
      resolve();
    };

    if (window.Kakao?.isInitialized?.()) {
      resolve();
      return;
    }

    const existing = document.querySelector('script[data-kakao-sdk]');
    if (existing) {
      existing.addEventListener('load', init);
      existing.addEventListener('error', () => reject(new Error('Kakao SDK load failed')));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2/kakao.min.js';
    script.async = true;
    script.dataset.kakaoSdk = 'true';
    script.onload = init;
    script.onerror = () => reject(new Error('Kakao SDK load failed'));
    document.head.appendChild(script);
  });
}

export function kakaoLogin(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!window.Kakao) {
      reject(new Error('Kakao SDK not loaded'));
      return;
    }
    window.Kakao.Auth.login({
      success: (response) => resolve(response.access_token),
      fail: (error) => reject(error),
    });
  });
}
