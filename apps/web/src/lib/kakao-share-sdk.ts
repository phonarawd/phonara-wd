import {
  buildKakaoFeedShareArgs,
  canConfigureKakaoShare,
  KAKAO_SHARE_SDK_SCRIPT_ID,
  KAKAO_SHARE_SDK_URL,
  readKakaoJavascriptKey,
  type KakaoFeedShareArgs,
} from '@/domain/kakao-share-display-contract';

type KakaoShareSdk = {
  init: (key: string) => void;
  isInitialized: () => boolean;
  Share: {
    sendDefault: (args: {
      objectType: 'feed';
      content: {
        title: string;
        description: string;
        imageUrl: string;
        link: { mobileWebUrl: string; webUrl: string };
      };
    }) => void;
  };
};

declare global {
  interface Window {
    Kakao?: KakaoShareSdk;
  }
}

let loadPromise: Promise<KakaoShareSdk> | null = null;
let initialized = false;

function ensureKakaoScript(): Promise<void> {
  if (typeof document === 'undefined') {
    return Promise.reject(new Error('kakao_sdk_unavailable'));
  }
  const existing = document.getElementById(KAKAO_SHARE_SDK_SCRIPT_ID);
  if (existing) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = KAKAO_SHARE_SDK_SCRIPT_ID;
    script.src = KAKAO_SHARE_SDK_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('kakao_sdk_load_failed'));
    document.head.appendChild(script);
  });
}

export async function loadKakaoShareSdk(): Promise<KakaoShareSdk> {
  if (!canConfigureKakaoShare()) {
    throw new Error('kakao_sdk_unconfigured');
  }
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('kakao_sdk_unavailable');
  }
  if (window.Kakao?.isInitialized()) {
    return window.Kakao;
  }
  if (!loadPromise) {
    loadPromise = (async () => {
      await ensureKakaoScript();
      const sdk = window.Kakao;
      if (!sdk) throw new Error('kakao_sdk_missing');
      if (!initialized) {
        sdk.init(readKakaoJavascriptKey());
        initialized = true;
      }
      return sdk;
    })();
  }
  return loadPromise;
}

export function canUseKakaoShare(): boolean {
  return canConfigureKakaoShare() && typeof window !== 'undefined';
}

export async function shareReferralViaKakao(input: KakaoFeedShareArgs): Promise<void> {
  const sdk = await loadKakaoShareSdk();
  const args = buildKakaoFeedShareArgs({
    shareTitle: input.title,
    shareText: input.description,
    inviteUrl: input.inviteUrl,
    imageUrl: input.imageUrl,
  });
  sdk.Share.sendDefault({
    objectType: 'feed',
    content: {
      title: args.title,
      description: args.description,
      imageUrl: args.imageUrl,
      link: {
        mobileWebUrl: args.inviteUrl,
        webUrl: args.inviteUrl,
      },
    },
  });
}
