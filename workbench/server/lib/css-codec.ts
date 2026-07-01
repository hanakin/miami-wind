// css-codec — blob <-> the shadcn `css` object stored on the theme registry item. shadcn allows
// string leaf values ("direct CSS string"), so each top-level block is stored verbatim as
// `prelude -> raw body`. No CSS-declaration parsing; the workbench mirrors the same object into
// globals.css. registry.json stays the single source of truth.

export type CssValue = string | { [key: string]: CssValue };

// ponytail: string/comment-aware top-level splitter — enough for the realistic grammar (@layer /
// @keyframes / @media / @utility blocks, bare selectors, bodyless at-rules like @import). Nested
// braces are preserved verbatim inside each body. Ceiling: comments *between* top-level blocks
// attach to the next prelude; upgrade to css-tree only if exact between-block fidelity is needed.
export function parseCss(text: string): Record<string, string> {
	const out: Record<string, string> = {};
	const n = text.length;
	let i = 0;
	let prelude = "";

	const add = (rawKey: string, body: string) => {
		const key = rawKey.trim().replace(/\s+/g, " ");
		if (!key) return;
		out[key] = out[key] ? `${out[key]}\n${body}` : body;
	};

	// advance past a /* */ comment or a '…'/"…" string starting at j; returns the index after it.
	const skip = (j: number): number => {
		const c = text[j];
		if (c === "/" && text[j + 1] === "*") {
			const end = text.indexOf("*/", j + 2);
			return end === -1 ? n : end + 2;
		}
		if (c === '"' || c === "'") {
			let k = j + 1;
			while (k < n && text[k] !== c) k += text[k] === "\\" ? 2 : 1;
			return k + 1;
		}
		return j + 1;
	};

	while (i < n) {
		const ch = text[i];
		if ((ch === "/" && text[i + 1] === "*") || ch === '"' || ch === "'") {
			const next = skip(i);
			prelude += text.slice(i, next);
			i = next;
			continue;
		}
		if (ch === "{") {
			let depth = 1;
			let j = i + 1;
			while (j < n && depth > 0) {
				const c = text[j];
				if ((c === "/" && text[j + 1] === "*") || c === '"' || c === "'") {
					j = skip(j);
					continue;
				}
				if (c === "{") depth++;
				else if (c === "}" && --depth === 0) break;
				j++;
			}
			add(prelude, text.slice(i + 1, j).trim());
			prelude = "";
			i = j + 1;
			continue;
		}
		if (ch === ";") {
			add(prelude, ""); // bodyless at-rule (@import "x";)
			prelude = "";
			i++;
			continue;
		}
		prelude += ch;
		i++;
	}
	return out;
}

export function serializeCss(css: Record<string, CssValue>): string {
	const block = (key: string, val: CssValue): string => {
		if (typeof val === "string") {
			return val.trim() === "" ? `${key};` : `${key} {\n${val}\n}`;
		}
		const inner = Object.entries(val)
			.map(([k, v]) => (typeof v === "string" ? `${k}: ${v};` : block(k, v)))
			.join("\n");
		return `${key} {\n${inner}\n}`;
	};
	return Object.entries(css)
		.map(([k, v]) => block(k, v))
		.join("\n\n");
}
