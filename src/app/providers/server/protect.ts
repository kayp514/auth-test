type AuthProtectOptions = {
  /**
   * The URL to redirect the user to if they are not authorized.
   */
  unauthorizedUrl?: string;
  /**
   * The URL to redirect the user to if they are not authenticated.
   */
  unauthenticatedUrl?: string;
};
