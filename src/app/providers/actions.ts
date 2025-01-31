import { TernSecureAuth, ternSecureAuth } from '../providers/utils/client-init'
import { 
  signInWithEmailAndPassword,
  sendEmailVerification,
  createUserWithEmailAndPassword,
  getRedirectResult,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithRedirect } from 'firebase/auth'
import type { SignInResponse } from './utils/types'
import {  handleFirebaseAuthError } from './utils/errors';

export async function createUser(email: string, password: string): Promise<SignInResponse> {
  const auth = TernSecureAuth()
  try {
    
    const actionCodeSettings = {
      url: `${window.location.origin}/sign-in`,
      handleCodeInApp: true
    };

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    await sendEmailVerification(userCredential.user, actionCodeSettings)
    
    return { 
      success: true,
      message: 'Account created successfully. Please check your email for verification', 
      user: userCredential.user };

  } catch (error) {
    const authError = handleFirebaseAuthError(error)
    return { 
      success: false,
      message: authError.message,
      error: authError.code,
      user: null
    }
  }
}


export async function signInWithEmail(email: string, password: string): Promise<SignInResponse> {
  const auth = TernSecureAuth()
  try {
  const UserCredential = await signInWithEmailAndPassword(auth, email, password)
  const user = UserCredential.user
  return { 
    success: true, 
    message: 'Authentication successful',
    user: user,
    error: !user.emailVerified ? 'REQUIRES_VERIFICATION' : 'AUTHENTICATED'
  };

} catch (error){
  const authError = handleFirebaseAuthError(error)
  return { 
    success: false,
    message: authError.message,
    error: authError.code,
    user: null
  }
}
}

export async function signInWithRedirectGoogle() {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({
    access_type: 'offline',
    login_hint: 'user@example.com',
    prompt: 'select_account'
  })

  try {
    await signInWithRedirect(ternSecureAuth, provider)
    return { success: true, message: 'Redirect initiated' }
  } catch (error) {
    const authError = handleFirebaseAuthError(error)
    return { 
      success: false,
      message: authError.message,
      error: authError.code,
      user: null
    }
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
    const authError = handleFirebaseAuthError(error)
    return { 
      success: false,
      message: authError.message,
      error: authError.code,
      user: null
    }
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
    const authError = handleFirebaseAuthError(error)
    return { 
      success: false,
      message: authError.message,
      error: authError.code,
      user: null
    }
  }
}

export async function resendEmailVerification() {
  const auth = TernSecureAuth()
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user found. Please try signing up again.');
    }

    await user.reload();

    if (user.emailVerified) {
      return { 
        success: true, 
        message: 'Email is already verified. You can sign in.',
        isVerified: true 
      };
    }

    const actionCodeSettings = {
      url: `${window.location.origin}/sign-in`,
      handleCodeInApp: true,
    };

    await sendEmailVerification(user, actionCodeSettings);
    return { 
      success: true, 
      message: 'Verification email sent successfully.',
      isVerified: false
     };
    } catch (error) {
      const authError = handleFirebaseAuthError(error)
      return { 
        success: false,
        message: authError.message,
        error: authError.code,
        user: null
      }
    }
}