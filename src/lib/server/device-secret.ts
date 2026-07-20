import { createCipheriv, createDecipheriv, randomBytes } from "crypto"

/**
 * Server-only AES-256-GCM for the device unlock PIN/pattern
 * (service_orders/quotes.device_unlock_secret_encrypted). Only import this
 * from Route Handlers — never from a "use client" component, and never
 * expose DEVICE_SECRET_ENCRYPTION_KEY itself outside this file. Callers get
 * a request-scoped 500 (via their own try/catch) if the key is missing or
 * malformed, same pattern as the SUPABASE_SERVICE_ROLE_KEY check in
 * app/api/team/invite/route.ts.
 */

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 12

function getKey(): Buffer {
  const raw = process.env.DEVICE_SECRET_ENCRYPTION_KEY
  if (!raw) {
    throw new Error("DEVICE_SECRET_ENCRYPTION_KEY não configurada no servidor")
  }
  const key = Buffer.from(raw, "base64")
  if (key.length !== 32) {
    throw new Error("DEVICE_SECRET_ENCRYPTION_KEY deve decodificar (base64) para exatamente 32 bytes")
  }
  return key
}

/** iv, authTag and ciphertext, each base64, joined with ":" so the result fits a `text` column. */
export function encryptDeviceSecret(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const authTag = cipher.getAuthTag()
  return [iv.toString("base64"), authTag.toString("base64"), ciphertext.toString("base64")].join(":")
}

export function decryptDeviceSecret(encoded: string): string {
  const key = getKey()
  const [ivB64, authTagB64, ciphertextB64] = encoded.split(":")
  if (!ivB64 || !authTagB64 || !ciphertextB64) {
    throw new Error("Valor cifrado em formato inválido")
  }
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivB64, "base64"))
  decipher.setAuthTag(Buffer.from(authTagB64, "base64"))
  const plaintext = Buffer.concat([decipher.update(Buffer.from(ciphertextB64, "base64")), decipher.final()])
  return plaintext.toString("utf8")
}
