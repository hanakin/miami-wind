import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { WORKBENCH_ROOT } from "../server/lib/registry-paths";
import { readSlots, writeSlots } from "../server/lib/tsx-slots";

const UI = join(WORKBENCH_ROOT, "src/components/ui");
const vendored = (name: string) => readFileSync(join(UI, `${name}.tsx`), "utf8");

describe("tsx-slots — read", () => {
	it("reads a multi-part component's slots (dropdown-menu)", () => {
		const s = readSlots(vendored("dropdown-menu"));
		expect(s["dropdown-menu-item"]).toContain("relative flex cursor-default");
		expect(s["dropdown-menu-item"]).toContain("data-[variant=destructive]:text-destructive");
		expect(s).toHaveProperty("dropdown-menu-content");
	});

	it("joins a multi-literal cn into one editable string (input)", () => {
		const s = readSlots(vendored("input"));
		expect(s.input).toContain("h-9 w-full");
		expect(s.input).toContain("focus-visible:border-ring"); // 2nd literal
		expect(s.input).toContain("aria-invalid:border-destructive"); // 3rd literal
	});
});

describe("tsx-slots — write", () => {
	it("replaces a slot's classes and preserves the className passthrough", () => {
		const out = writeSlots(vendored("dropdown-menu"), {
			"dropdown-menu-item": "relative flex cursor-pointer",
		});
		expect(readSlots(out)["dropdown-menu-item"]).toBe("relative flex cursor-pointer");
		// passthrough kept: the cn still ends with the `className` identifier
		expect(out).toContain('"relative flex cursor-pointer", className');
	});

	it("is idempotent — writing twice equals writing once", () => {
		const edit = { "command-item": "px-3 hover:cursor-pointer" };
		const once = writeSlots(vendored("command"), edit);
		const twice = writeSlots(once, edit);
		expect(twice).toBe(once);
	});

	it("inserts a className={cn(...)} on a slot that has none", () => {
		const src = 'const X = () => <div data-slot="x" />;\n';
		const out = writeSlots(src, { x: "p-2 gap-1" });
		expect(out).toContain('className={cn("p-2 gap-1")}');
		expect(readSlots(out).x).toBe("p-2 gap-1");
	});

	it("adds a leading literal when the cn has only non-string args", () => {
		const src = 'const X = () => <i data-slot="y" className={cn(foo(), className)} />;\n';
		const out = writeSlots(src, { y: "text-sm" });
		expect(readSlots(out).y).toBe("text-sm");
		expect(out).toContain('cn("text-sm", foo(), className)');
	});

	it("replaces a bare string className", () => {
		const src = 'const X = () => <b data-slot="z" className="a b" />;\n';
		const out = writeSlots(src, { z: "c d" });
		expect(readSlots(out).z).toBe("c d");
	});

	it("only touches the requested slot", () => {
		const before = readSlots(vendored("dropdown-menu"));
		const out = writeSlots(vendored("dropdown-menu"), { "dropdown-menu-item": "x" });
		const after = readSlots(out);
		expect(after["dropdown-menu-content"]).toBe(before["dropdown-menu-content"]);
	});
});
