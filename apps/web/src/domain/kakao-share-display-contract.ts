/**
 * Kakao Talk share augment for `/referral/invite` (E10 growth UI).
 * Web Share API remains canonical; Kakao SDK is progressive enhancement only.
 */

import type { MessageKey } from '@phonara/i18n';

import { REFERRAL_INVITE_ROUTE } from './referral-hub-display-contract';

export const KAKAO_SHARE_UI_UNLOCK_TODO = 'ew-e10-growth-ui' as const;
export const KAKAO_SHARE_SDK_SCRIPT_ID = 'phonara-kakao-sdk' as const;
export const KAKAO_SHARE_SDK_URL =
  'https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js' as const;

export const KAKAO_JAVASCRIPT_KEY_ENV = 'VITE_KAKAO_JAVASCRIPT_KEY' as const;

export type KakaoFeedShareArgs = {
  title: string;
  description: string;
  inviteUrl: string;
  imageUrl: string;
};

export const KAKAO_SHARE_UNAVAILABLE_KEY =
  'referral.kakao.unavailable' as const satisfies MessageKey;
export const KAKAO_SHARE_FAILED_KEY = 'referral.kakao.failed' as const satisfies MessageKey;
export const KAKAO_SHARE_SUCCESS_KEY = 'referral.kakao.success' as const satisfies MessageKey;

export function readKakaoJavascriptKey(): string {
  const raw = import.meta.env[KAKAO_JAVASCRIPT_KEY_ENV as keyof ImportMetaEnv];
  return typeof raw === 'string' ? raw.trim() : '';
}

/** True when operator configured a Kakao JavaScript key for this build. */
export function canConfigureKakaoShare(): boolean {
  return readKakaoJavascriptKey().length > 0;
}

export function buildKakaoFeedShareArgs(input: {
  shareTitle: string;
  shareText: string;
  inviteUrl: string;
  imageUrl: string;
}): KakaoFeedShareArgs {
  return {
    title: input.shareTitle,
    description: input.shareText,
    inviteUrl: input.inviteUrl,
    imageUrl: input.imageUrl,
  };
}

export function resolveKakaoShareRoute(): typeof REFERRAL_INVITE_ROUTE {
  return REFERRAL_INVITE_ROUTE;
}
