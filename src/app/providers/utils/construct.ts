/**
 * Constructs a full URL with the current origin
 * @param path - The path to construct the URL for
 * @returns The full URL with origin
 */
export const constructFullUrl = (path: string) => {
    const baseUrl = window.location.origin
    if (path.startsWith('http')) {
      return path
    }
    return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`
  }
  
  /**
   * Constructs a URL with redirect parameters
   * @param path - The base path (usually login path)
   * @param redirectUrl - The URL to redirect to after action completes
   * @param loginPath - The login path to check against
   * @param signUpPath - The sign up path to check against
   * @returns The full URL with redirect parameters
   */
  export const constructUrlWithRedirect = (path: string, redirectUrl: string, loginPath: string, signUpPath: string) => {
    // Create the URL with the full origin
    const url = new URL(path, window.location.origin)
    
    // Add redirect parameter if provided and not redirecting to login
    if (redirectUrl && !redirectUrl.startsWith(loginPath) && !redirectUrl.startsWith(signUpPath)) {
      // Ensure redirect URL is also absolute if it's not already
      const fullRedirectUrl = redirectUrl.startsWith('http') 
        ? redirectUrl 
        : constructFullUrl(redirectUrl)
      
      url.searchParams.set('redirect_url', fullRedirectUrl)
    }
    
    return url.toString()
  }
  
  /**
   * Gets a validated redirect URL ensuring it's from the same origin
   * @param redirectUrl - The URL to validate
   * @param searchParams - The search parameters to check for redirect_url
   * @returns A validated redirect URL
   */
  export const getValidRedirectUrl = (
    redirectUrl: string | undefined,
    searchParams: URLSearchParams
  ): string => {
    const redirect = redirectUrl || searchParams.get('redirect_url') || '/'
    
    try {
      if (redirect.startsWith('http')) {
        const url = new URL(redirect)
        if (url.origin === window.location.origin) {
          return redirect
        }
        return '/'
      }
      return constructFullUrl(redirect)
    } catch (e) {
      console.error('Invalid redirect URL:', e)
      return constructFullUrl('/')
    }
  }
  
  /**
 * Determines the final redirect URL based on multiple sources
 * @param props - Props redirect URL
 * @param params - URL search params
 * @param currentPath - Current path before redirect
 * @returns The validated redirect URL
 */
export const determineAuthRedirect = (
  props: string | undefined,
  params: URLSearchParams,
  currentPath: string,
): string => {
  // Priority order:
  // 1. URL params redirect_url
  // 2. Props redirectUrl
  // 3. Current path
  // 4. Default path (/)

  const paramRedirect = params.get("redirect_url")
  const redirect = paramRedirect || props || currentPath || "/"

  return getValidRedirectUrl(redirect, params)
}