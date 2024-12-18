import { TernSecureAuth, ternSecureAuth } from '../providers/utils/client-init'
import { signInWithEmailAndPassword, getRedirectResult, GoogleAuthProvider, OAuthProvider, signInWithRedirect } from 'firebase/auth'
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
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({
    login_hint: 'user@example.com',
    prompt: 'select_account',
  })

  try {
    await signInWithRedirect(ternSecureAuth, provider)
    return { success: true, message: 'Redirect initiated' }
  } catch (error) {
    console.error('Error during Google sign-in:', error)
    return { success: false, error: 'Failed to sign in with Google' }
  }
}


export async function signInWithMicrosoft() {
  const provider = new OAuthProvider('microsoft.com')
  provider.setCustomParameters({
    prompt: 'consent'
  })

  try {
    await signInWithRedirect(ternSecureAuth, provider)
    return { success: true, message: 'Redirect initiated' }
  } catch (error) {
    console.error('Error during Google sign-in:', error)
    return { success: false, error: 'Failed to sign in with Google' }
  }
}


export async function handleAuthRedirectResult() {
  try {
    const result = await getRedirectResult(ternSecureAuth)
    console.log('redirect result', result)
    if (result) {
      const user = result.user
      return { success: true, user }
    } else {
      return { success: false, error: 'No redirect result' }
    }
  } catch (error) {
    console.error('Error handling auth redirect result:', error)
    return { success: false, error: 'Failed to handle auth redirect' }
  }
}