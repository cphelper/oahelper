import CryptoJS from 'crypto-js'

const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || '12022'

export const encryptId = (id: number | string): string => {
  if (!id) return ''
  return CryptoJS.AES.encrypt(id.toString(), ENCRYPTION_KEY)
    .toString()
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

export const decryptId = (encoded: string): number | null => {
  if (!encoded) return null
  try {
    const normalized = encoded.replace(/-/g, '+').replace(/_/g, '/')
    const bytes = CryptoJS.AES.decrypt(normalized, ENCRYPTION_KEY)
    const decrypted = bytes.toString(CryptoJS.enc.Utf8)
    return parseInt(decrypted, 10)
  } catch (error) {
    console.error('Decryption failed:', error)
    return null
  }
}

// Simple base64 encoding (for non-sensitive IDs)
export const encodeId = (id: number | string): string => {
  if (typeof window === 'undefined') {
    return Buffer.from(id.toString()).toString('base64')
  }
  return btoa(id.toString())
}

export const decodeId = (encodedId: string): string | null => {
  try {
    if (typeof window === 'undefined') {
      return Buffer.from(encodedId, 'base64').toString('utf-8')
    }
    return atob(encodedId)
  } catch (error) {
    console.error('Invalid encoded ID:', error)
    return null
  }
}
