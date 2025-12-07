import { ternSecureInstrumentation } from "@tern-secure/nextjs/server";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    ternSecureInstrumentation();
  }
}