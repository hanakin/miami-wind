import * as ts from "typescript";

/**
 * tsx-slots — read and write per-slot Tailwind classes in a real component `.tsx`.
 *
 * The custom-component model: once a primitive is "owned" (vendored into the registry), each
 * `data-slot`'s classes ARE the source of truth — no delta file, no build-time injection. The editor
 * reads the current classes per slot to populate its controls, and writes the full new class string
 * back into that slot's `className`. Writes preserve the trailing `className` passthrough and any
 * non-string args (e.g. `buttonVariants()`), collapsing the string-literal args into one — so
 * re-saving is idempotent.
 *
 * Assumes the shadcn shape: `data-slot="x" … className={cn("literal", …, className)}` (or a bare
 * string className, or no className at all — both handled). A slot whose className is computed entirely
 * from a non-string expression reads as "" and gains a leading string literal on write.
 */

function parse(source: string): ts.SourceFile {
	return ts.createSourceFile("c.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
}

type Attrs = ts.JsxAttributes;

/** The `data-slot` string value of a JSX element's attributes, or undefined. */
function slotName(attrs: Attrs): string | undefined {
	for (const p of attrs.properties) {
		if (
			ts.isJsxAttribute(p) &&
			p.name.getText() === "data-slot" &&
			p.initializer &&
			ts.isStringLiteral(p.initializer)
		) {
			return p.initializer.text;
		}
	}
	return undefined;
}

function classNameAttr(attrs: Attrs): ts.JsxAttribute | undefined {
	for (const p of attrs.properties) {
		if (ts.isJsxAttribute(p) && p.name.getText() === "className") return p;
	}
	return undefined;
}

/** The `cn(...)` call inside a className attribute, if that's its shape. */
function cnCall(attr: ts.JsxAttribute): ts.CallExpression | undefined {
	const init = attr.initializer;
	if (init && ts.isJsxExpression(init) && init.expression && ts.isCallExpression(init.expression)) {
		const callee = init.expression.expression;
		if (ts.isIdentifier(callee) && callee.text === "cn") return init.expression;
	}
	return undefined;
}

/** The bare string literal of a className (`="x"` or `={"x"}`), if that's its shape. */
function bareString(attr: ts.JsxAttribute): ts.StringLiteral | undefined {
	const init = attr.initializer;
	if (init && ts.isStringLiteral(init)) return init;
	if (init && ts.isJsxExpression(init) && init.expression && ts.isStringLiteral(init.expression)) {
		return init.expression;
	}
	return undefined;
}

/** The editable classes for one className attribute: the cn() string args joined, or a bare string. */
function readClasses(attr: ts.JsxAttribute): string {
	const cn = cnCall(attr);
	if (cn) {
		return cn.arguments
			.filter((a): a is ts.StringLiteral => ts.isStringLiteral(a))
			.map((a) => a.text)
			.join(" ");
	}
	return bareString(attr)?.text ?? "";
}

/** Walk every JSX element, yielding [slot, openingAttributes] for those that carry a data-slot. */
function* slots(sf: ts.SourceFile): Generator<[string, ts.JsxOpeningLikeElement]> {
	const seen = new Set<string>();
	const visit = function* (node: ts.Node): Generator<[string, ts.JsxOpeningLikeElement]> {
		if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
			const slot = slotName(node.attributes);
			if (slot && !seen.has(slot)) {
				seen.add(slot);
				yield [slot, node];
			}
		}
		for (const child of node.getChildren(sf)) yield* visit(child);
	};
	yield* visit(sf);
}

/** Current classes for every data-slot in the file (first occurrence wins). */
export function readSlots(source: string): Record<string, string> {
	const sf = parse(source);
	const out: Record<string, string> = {};
	for (const [slot, el] of slots(sf)) {
		const attr = classNameAttr(el.attributes);
		out[slot] = attr ? readClasses(attr) : "";
	}
	return out;
}

type Splice = { start: number; end: number; text: string };

/** The splice that rewrites one element's className to `classes` (or inserts one if absent). */
function spliceFor(el: ts.JsxOpeningLikeElement, sf: ts.SourceFile, classes: string): Splice {
	const lit = JSON.stringify(classes);
	const attr = classNameAttr(el.attributes);

	if (attr) {
		const cn = cnCall(attr);
		if (cn) {
			// Rebuild the arg list: the first string literal becomes the new value, later string
			// literals drop out, every non-string arg (calls, `className` passthrough) is kept verbatim.
			let placed = false;
			const args: string[] = [];
			for (const a of cn.arguments) {
				if (ts.isStringLiteral(a)) {
					if (!placed) {
						args.push(lit);
						placed = true;
					}
				} else {
					args.push(a.getText(sf));
				}
			}
			if (!placed) args.unshift(lit);
			// Replace exactly the argument span (not the NodeArray, which swallows inter-paren trivia),
			// so output is `cn("…", className)` and re-saving is byte-identical. Biome re-wraps on format.
			const all = cn.arguments;
			const first = all[0];
			const last = all[all.length - 1];
			if (!first || !last) return { start: all.pos, end: all.end, text: lit }; // empty cn()
			return { start: first.getStart(sf), end: last.getEnd(), text: args.join(", ") };
		}
		const bare = bareString(attr);
		if (bare) return { start: bare.getStart(sf), end: bare.getEnd(), text: lit };
		// className present but some other shape — replace the whole attribute with a cn() form.
		return {
			start: attr.getStart(sf),
			end: attr.getEnd(),
			text: `className={cn(${lit}, className)}`,
		};
	}

	// No className at all — insert one right after the data-slot attribute.
	const ds = el.attributes.properties.find(
		(p): p is ts.JsxAttribute => ts.isJsxAttribute(p) && p.name.getText() === "data-slot",
	);
	const at = (ds ?? el.attributes).getEnd();
	return { start: at, end: at, text: ` className={cn(${lit})}` };
}

/** Write the full class string for each given data-slot back into the source, idempotently. */
export function writeSlots(source: string, edits: Record<string, string>): string {
	const sf = parse(source);
	const byName = new Map(Object.entries(edits));
	const splices: Splice[] = [];
	for (const [slot, el] of slots(sf)) {
		const next = byName.get(slot);
		if (next !== undefined) splices.push(spliceFor(el, sf, next));
	}
	// Apply right-to-left so earlier offsets stay valid.
	splices.sort((a, b) => b.start - a.start);
	let out = source;
	for (const s of splices) out = out.slice(0, s.start) + s.text + out.slice(s.end);
	return out;
}
