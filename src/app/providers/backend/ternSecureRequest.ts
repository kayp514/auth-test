import { parse } from "cookie";
import type { TernUrl } from "./ternUrl";
import { createTernUrl } from "./ternUrl";
import { constants } from "./constants";

class TernSecureRequest extends Request {
  readonly ternUrl: TernUrl;
  readonly cookies: Map<string, string | undefined>;

  public constructor(
    input: TernSecureRequest | Request | RequestInfo,
    init?: RequestInit
  ) {
    const url =
      typeof input !== "string" && "url" in input ? input.url : String(input);
    super(url, init || typeof input === "string" ? undefined : input);
    this.ternUrl = this.deriveUrlFromHeaders(this);
    this.cookies = this.parseCookies(this);
  }

  public toJSON() {
    return {
      url: this.ternUrl.href,
      method: this.method,
      headers: JSON.stringify(Object.fromEntries(this.headers)),
      ternUrl: this.ternUrl.toString(),
      cookies: JSON.stringify(Object.fromEntries(this.cookies)),
    };
  }

  private deriveUrlFromHeaders(req: Request) {
    const initialUrl = new URL(req.url);
    const forwardedProto = req.headers.get(constants.Headers.ForwardedProto);
    const forwardedHost = req.headers.get(constants.Headers.ForwardedHost);
    const host = req.headers.get(constants.Headers.Host);
    const protocol = initialUrl.protocol;

    const resolvedHost = this.getFirstValueFromHeader(forwardedHost) ?? host;
    const resolvedProtocol =
      this.getFirstValueFromHeader(forwardedProto) ??
      protocol?.replace(/[:/]/, "");
    const origin =
      resolvedHost && resolvedProtocol
        ? `${resolvedProtocol}://${resolvedHost}`
        : initialUrl.origin;

    if (origin === initialUrl.origin) {
      return createTernUrl(initialUrl);
    }

    return createTernUrl(initialUrl.pathname + initialUrl.search, origin);
  }

  private getFirstValueFromHeader(value?: string | null) {
    return value?.split(",")[0];
  }

  private parseCookies(req: Request) {
    const cookiesRecord = parse(
      this.decodeCookieValue(req.headers.get("cookie") || "")
    );
    return new Map(Object.entries(cookiesRecord));
  }

  private decodeCookieValue(str: string) {
    return str ? str.replace(/(%[0-9A-Z]{2})+/g, decodeURIComponent) : str;
  }
}

export const createTernSecureRequest = (
  ...args: ConstructorParameters<typeof TernSecureRequest>
): TernSecureRequest => {
  return args[0] instanceof TernSecureRequest
    ? args[0]
    : new TernSecureRequest(...args);
};

export type { TernSecureRequest };
