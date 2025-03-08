import { box, randomBytes } from 'tweetnacl';
import { encodeBase64, decodeBase64, encodeUTF8, decodeUTF8 } from 'tweetnacl-util';

let clientKeyPair: ReturnType<typeof box.keyPair> | null = null;
let serverPublicKey: Uint8Array | null = null;

const clientPublicKeys = new Map<string, Uint8Array>();
const serverKeyPair = box.keyPair();

export const generateKeyPair = () => {
  clientKeyPair = box.keyPair();
  return encodeBase64(clientKeyPair.publicKey);
};

export const setServerPublicKey = (publicKeyBase64: string) => {
  serverPublicKey = decodeBase64(publicKeyBase64);
};

export const isEncryptionReady = () => {
  return clientKeyPair !== null && serverPublicKey !== null;
};

export const encryptForServer = (message: string) => {
  if (!isEncryptionReady()) return null;
  
  const messageString = typeof message === 'string' ? message : JSON.stringify(message);
  const messageUint8 = decodeUTF8(messageString);
  
  const nonce = randomBytes(box.nonceLength);
  
  const encrypted = box(
    messageUint8,
    nonce,
    serverPublicKey!,
    clientKeyPair!.secretKey
  );
  
  const fullMessage = new Uint8Array(nonce.length + encrypted.length);
  fullMessage.set(nonce);
  fullMessage.set(encrypted, nonce.length);
  
  return encodeBase64(fullMessage);
};

export const decryptFromServer = (encryptedBase64: string) => {
  if (!isEncryptionReady()) return null;
  
  const encryptedMessage = decodeBase64(encryptedBase64);
  
  const nonce = encryptedMessage.slice(0, box.nonceLength);
  const ciphertext = encryptedMessage.slice(box.nonceLength);
  
  const decrypted = box.open(
    ciphertext,
    nonce,
    serverPublicKey!,
    clientKeyPair!.secretKey
  );
  
  if (!decrypted) return null;
  
  const messageString = encodeUTF8(decrypted);
  
  try {
    return JSON.parse(messageString);
  } catch (e) {
    return messageString;
  }
};

export const encryptForClient = (clientId: string, message: any): string | null => {
    const clientPublicKey = clientPublicKeys.get(clientId);
    if (!clientPublicKey) return null;
  
    const messageString = typeof message === 'string' ? message : JSON.stringify(message);
    const messageUint8 = decodeUTF8(messageString);
    
    // Generate a one-time nonce
    const nonce = randomBytes(box.nonceLength);
    
    // Encrypt the message
    const encrypted = box(
      messageUint8,
      nonce,
      clientPublicKey,
      serverKeyPair.secretKey
    );
    
    // Combine nonce and encrypted message
    const fullMessage = new Uint8Array(nonce.length + encrypted.length);
    fullMessage.set(nonce);
    fullMessage.set(encrypted, nonce.length);
    
    // Return as base64 string
    return encodeBase64(fullMessage);
  };
  
  export const decryptFromClient = (clientId: string, encryptedBase64: string): any | null => {
    const clientPublicKey = clientPublicKeys.get(clientId);
    if (!clientPublicKey) return null;
    
    // Decode the message from base64
    const encryptedMessage = decodeBase64(encryptedBase64);
    
    // Extract the nonce
    const nonce = encryptedMessage.slice(0, box.nonceLength);
    const ciphertext = encryptedMessage.slice(box.nonceLength);
    
    // Decrypt the message
    const decrypted = box.open(
      ciphertext,
      nonce,
      clientPublicKey,
      serverKeyPair.secretKey
    );
    
    if (!decrypted) return null;
    
    // Convert to string
    const messageString = encodeUTF8(decrypted);
    
    // Try to parse as JSON, return as string if not valid JSON
    try {
      return JSON.parse(messageString);
    } catch (e) {
      return messageString;
    }
  };

