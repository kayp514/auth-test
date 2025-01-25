import { Verify } from "../components/verify"

// Internal route mapping
export const internalRoutes = {
  verify: {
    pattern: /^\/sign-up\/verify$/,
    component: Verify,
  },
}

// Internal route handler
export function handleInternalRoute(pathname: string) {
  for (const [key, route] of Object.entries(internalRoutes)) {
    if (route.pattern.test(pathname)) {
      return route.component
    }
  }
  return null
}

