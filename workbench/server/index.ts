import { Hono } from "hono";
import { env } from "./env";
import components from "./routes/components";
import cva from "./routes/cva";
import models from "./routes/models";
import primitives from "./routes/primitives";
import source from "./routes/source";
import tailwind from "./routes/tailwind";
import theme from "./routes/theme";

const app = new Hono();

const routes = app
	.get("/api/health", (c) => c.json({ ok: true }))
	.route("/api/cva", cva)
	.route("/api/components", components)
	.route("/api/models", models)
	.route("/api/primitives", primitives)
	.route("/api/source", source)
	.route("/api/theme", theme)
	.route("/api/tailwind", tailwind);

export type AppType = typeof routes;

export default {
	port: env.PORT,
	fetch: app.fetch,
};
