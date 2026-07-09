import { supabase } from '@/lib/supabase';

export type KycDocumentSlot = 'id-front' | 'id-back' | 'selfie';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const MAX_BYTES = 5 * 1024 * 1024;

function extensionForMime(mime: string): string {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'jpg';
}

export function validateKycImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type)) return 'kyc_documents_invalid_type';
  if (file.size > MAX_BYTES) return 'kyc_documents_too_large';
  return null;
}

export async function uploadKycDocument(
  userId: string,
  slot: KycDocumentSlot,
  file: File,
): Promise<string> {
  const validation = validateKycImageFile(file);
  if (validation) throw new Error(validation);

  const ext = extensionForMime(file.type);
  const path = `${userId}/${slot}.${ext}`;

  const { error } = await supabase.storage.from('kyc-documents').upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) throw error;
  return path;
}

export type KycDocumentPaths = {
  documentFrontPath: string;
  documentBackPath: string;
  selfiePath: string;
};

export async function createSignedKycUrl(path: string, expiresIn = 300): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('kyc-documents')
    .createSignedUrl(path, expiresIn);
  if (error) return null;
  return data.signedUrl;
}
