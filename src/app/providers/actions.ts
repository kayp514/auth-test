import { TernSecureAuth } from '../providers/utils/client-init'
import { signInWithEmailAndPassword, getRedirectResult, GoogleAuthProvider, signInWithRedirect } from 'firebase/auth'
import { createSessionCookie } from '../providers/server/sessionTernSecure'


export async function signInWithEmail(email: string, password: string){
  const auth = TernSecureAuth()
  try {
  const UserCredential = await signInWithEmailAndPassword(auth, email, password)
  const idToken = await UserCredential.user.getIdToken();

  const res = await createSessionCookie(idToken);

  if(res.success) {
    return { success: true, message: 'Connected.' };
  } else {
    throw new Error(res.message);
  }
} catch (error){
  const errorMessage = error instanceof Error ? error.message : 'Failed to sign in';
  throw new Error(errorMessage);
}
}

export async function signInWithRedirectGoogle() {
  const auth = TernSecureAuth()
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({
    login_hint: 'user@example.com',
    prompt: 'select_account'
  })

  try {
    await signInWithRedirect(auth, provider)
    return { success: true, message: 'Redirect initiated' }
  } catch (error) {
    console.error('Error during Google sign-in:', error)
    return { success: false, error: 'Failed to sign in with Google' }
  }
}


export async function signInWithMicrosoft() {
  const auth = TernSecureAuth()
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({
    'login_hint': 'user@example.com',
    'prompt': 'select_account'
  })

  try {
    await signInWithRedirect(auth, provider)
    return { success: true, message: 'Redirect initiated' }
  } catch (error) {
    console.error('Error during Google sign-in:', error)
    return { success: false, error: 'Failed to sign in with Google' }
  }
}


export async function handleAuthRedirectResult() {
  const auth = TernSecureAuth()
  try {
    const result = await getRedirectResult(auth)
    if (result) {
      const user = result.user
      return { success: true, user }
    } else {
      return { success: false, error: 'No redirect result' }
    }
  } catch (error: any) {
    console.error('Error handling auth redirect result:', error)
    return { success: false, error: error.message || 'Failed to handle auth redirect', code: error.code }
  }
}