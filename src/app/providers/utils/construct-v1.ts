//v1: redict without taking priority from the sign-in page

import { isInternalRoute } from "../internal/internal-route"

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
 * Checks if the current URL has a redirect loop
 * @param currentPath - The current pathname
 * @param redirectPath - The path we're trying to redirect to
 * @returns boolean indicating if there's a redirect loop
 */
export const hasRedirectLoop = (currentPath: string, redirectPath: string): boolean => {
  if (!currentPath || !redirectPath) return false

  // Remove any query parameters for comparison
  const cleanCurrentPath = currentPath.split("?")[0]
  const cleanRedirectPath = redirectPath.split("?")[0]

  return cleanCurrentPath === cleanRedirectPath
}
  
/**
 * Constructs a URL with redirect parameters while preventing loops
 * @param path - The base path (usually login path)
 * @param redirectUrl - The URL to redirect to after action completes
 * @param loginPath - The login path to check against
 * @param signUpPath - The sign up path to check against
 * @returns The full URL with redirect parameters
 */
export const constructUrlWithRedirect = (
  path: string,
  redirectUrl: string,
  loginPath: string,
  signUpPath: string,
): string => {
  // Create the URL with the full origin
  const url = new URL(path, window.location.origin)

    // Check for redirect loops
  if (hasRedirectLoop(window.location.pathname, path)) {
      return url.toString()
    }

  // If we already have a redirect param, keep it
  const currentSearchParams = new URLSearchParams(window.location.search)
  if (currentSearchParams.has("redirect")) {
    return window.location.href
  }

  // Add redirect parameter if provided and not redirecting to login/signup
  if (redirectUrl && !redirectUrl.startsWith(loginPath) && !redirectUrl.startsWith(signUpPath) && !isInternalRoute(redirectUrl)) {
    // Ensure redirect URL is also absolute if it's not already
    const fullRedirectUrl = redirectUrl.startsWith("http") ? redirectUrl : constructFullUrl(redirectUrl)

    url.searchParams.set("redirect", fullRedirectUrl)
  }

  return url.toString()
}


  
/**
 * Gets a validated redirect URL ensuring it's from the same origin
 * @param redirectUrl - The URL to validate
 * @param searchParams - The search parameters to check for redirect
 * @returns A validated redirect URL
 */
export const getValidRedirectUrl = (
  redirectUrl: string | undefined, 
  searchParams: URLSearchParams
): string => {
  const redirect = redirectUrl || searchParams.get("redirect") || '/'

  try {
    if (redirect.startsWith("http")) {
      const url = new URL(redirect)
      if (url.origin === window.location.origin) {
        return redirect
      }
      return '/'
    }
    return constructFullUrl(redirect)
  } catch (e) {
    console.error("Invalid redirect URL:", e)
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

  const paramRedirect = params.get("redirect_url") || params.get("redirect")
  const redirect = paramRedirect || props || currentPath || "/"

  return getValidRedirectUrl(redirect, params)
}




