import { Hono } from "hono";
import { getClassList } from "../lib/tailwind-classlist";

const tailwind = new Hono().get("/classes", async (c) => {
	return c.json({ classes: await getClassList() });
});

export default tailwind;
