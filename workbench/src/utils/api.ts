import { hc } from "hono/client";
import type { AppType } from "../../server";

// Typed RPC client. In dev, Vite proxies /api/* to the Hono server on :3000.
export const client = hc<AppType>("/");
