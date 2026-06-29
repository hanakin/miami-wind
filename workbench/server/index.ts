import { Hono } from "hono";
import { env } from "./env";
import cva from "./routes/cva";
import primitives from "./routes/primitives";
import tailwind from "./routes/tailwind";
import theme from "./routes/theme";

const app = new Hono();

const routes = app
	.get("/api/health", (c) => c.json({ ok: true }))
	.route("/api/cva", cva)
	.route("/api/primitives", primitives)
	.route("/api/theme", theme)
	.route("/api/tailwind", tailwind);

export type AppType = typeof routes;

export default {
	port: env.PORT,
	fetch: app.fetch,
};
