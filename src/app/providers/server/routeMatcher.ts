import type { NextRequest } from "next/server";
/**
 * Create a route matcher function for public paths
 */
export const createRouteMatcher = (patterns: string[]) => {
  return (request: NextRequest): boolean => {
    const { pathname } = request.nextUrl;
    return patterns.some((pattern) => {
      const regexPattern = pattern
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        .replace(/\\\*/g, ".*");

      return new RegExp(`^${regexPattern}$`).test(pathname);
    });
  };
};
