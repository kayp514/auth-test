class TernUrl extends URL {
  public isCrossOrigin(other: URL | string) {
    return this.origin !== new URL(other.toString()).origin;
  }
}

export type WithTernUrl<T> = T & {
  /**
   * When a NextJs app is hosted on a platform different from Vercel
   * or inside a container (Netlify, Fly.io, AWS Amplify, docker etc),
   * req.url is always set to `localhost:3000` instead of the actual host of the app.
   *
   */
  ternUrl: TernUrl;
};

export const createTernUrl = (
  ...args: ConstructorParameters<typeof TernUrl>
): TernUrl => {
  return new TernUrl(...args);
};

export type { TernUrl };
