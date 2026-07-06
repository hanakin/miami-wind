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

/** A named property's initializer from an object literal (unquoted identifier keys). */
function objProp(obj: ts.ObjectLiteralExpression, name: string): ts.Expression | undefined {
	for (const p of obj.properties) {
		if (ts.isPropertyAssignment(p) && p.name.getText() === name) return p.initializer;
	}
	return undefined;
}

/** base-ui root pattern: `useRender({ props: mergeProps({ className }, props), state: { slot: "x" } })`.
 *  There's no literal data-slot — the name is `state.slot`, classes are the className handed to
 *  props / mergeProps. Register the slot so categorization sees the root (classes may be "" when the
 *  className is a bare cva call — the model reads the cva base for it). */
function renderRootSlots(sf: ts.SourceFile): Record<string, string> {
	const out: Record<string, string> = {};
	const visit = (node: ts.Node) => {
		if (
			ts.isCallExpression(node) &&
			ts.isIdentifier(node.expression) &&
			node.expression.text === "useRender" &&
			node.arguments[0] &&
			ts.isObjectLiteralExpression(node.arguments[0])
		) {
			const cfg = node.arguments[0];
			const state = objProp(cfg, "state");
			const slotExpr =
				state && ts.isObjectLiteralExpression(state) ? objProp(state, "slot") : undefined;
			const slot = slotExpr && ts.isStringLiteral(slotExpr) ? slotExpr.text : undefined;
			if (slot && !(slot in out)) {
				const props = objProp(cfg, "props");
				let propObj: ts.ObjectLiteralExpression | undefined;
				if (
					props &&
					ts.isCallExpression(props) &&
					props.arguments[0] &&
					ts.isObjectLiteralExpression(props.arguments[0])
				)
					propObj = props.arguments[0];
				else if (props && ts.isObjectLiteralExpression(props)) propObj = props;
				out[slot] = classesFromValue(propObj ? objProp(propObj, "className") : undefined);
			}
		}
		ts.forEachChild(node, visit);
	};
	visit(sf);
	return out;
}

/** Current classes for every slot: literal `data-slot` elements + base-ui `useRender` roots. */
export function readSlots(source: string): Record<string, string> {
	const sf = parse(source);
	const out: Record<string, string> = renderRootSlots(sf);
	for (const [slot, el] of slots(sf)) {
		if (slot in out) continue;
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

/**
 * Inject `data-slot="<slot>"` onto the JSX opening element located at `line:column` — the coordinate
 * carried by the dev source-stamp (`data-mw-src`, 0-based, `getStart` of the opening element). This is
 * the Exposure step: it promotes a raw, un-tagged node into an addressable slot. className is left
 * untouched — the element keeps its classes and `spliceFor` handles them on the next style edit.
 *
 * Throws if `line:column` doesn't resolve to an opening element, or that element already has a slot.
 */
export function addSlotAt(source: string, line: number, column: number, slot: string): string {
	const sf = parse(source);
	let hit: ts.JsxOpeningLikeElement | undefined;
	const visit = (node: ts.Node): void => {
		if (hit) return;
		if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
			const pos = sf.getLineAndCharacterOfPosition(node.getStart(sf));
			if (pos.line === line && pos.character === column) {
				hit = node;
				return;
			}
		}
		ts.forEachChild(node, visit);
	};
	visit(sf);
	if (!hit) throw new Error(`No JSX opening element at ${line}:${column}`);
	if (slotName(hit.attributes) !== undefined) throw new Error("Element already has a data-slot");
	// Insert right after the tag name (`<ChevronDownIcon` → `<ChevronDownIcon data-slot="…"`).
	const at = hit.tagName.getEnd();
	return source.slice(0, at) + ` data-slot=${JSON.stringify(slot)}` + source.slice(at);
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

// ---- classNames={{ … }} surfaces --------------------------------------------------------------------
// Some components define their real class surfaces NOT as `data-slot` classNames but as the cn() values
// of a `classNames={{ key: cn("…", …) }}` object handed to a library — react-day-picker's day / weekday
// / nav, and any wrapper built the same way. Those carry no data-slot so readSlots misses them, yet
// they're editable classes all the same, keyed by the object key. Read/write them here so the editor
// can expose each surface (which selector it maps to in the preview is a per-component, render-time
// concern the client owns). ponytail: the cn-arg rebuild mirrors spliceFor but on an object-property
// value instead of a className attribute — kept separate so the vetted slot path stays untouched.

function asCnCall(node: ts.Node | undefined): ts.CallExpression | undefined {
	return node &&
		ts.isCallExpression(node) &&
		ts.isIdentifier(node.expression) &&
		node.expression.text === "cn"
		? node
		: undefined;
}

/** Editable classes from a value expression: a cn()'s string-literal args joined, or a bare string. */
function classesFromValue(expr: ts.Expression | undefined): string {
	const cn = asCnCall(expr);
	if (cn) {
		return cn.arguments
			.filter((a): a is ts.StringLiteral => ts.isStringLiteral(a))
			.map((a) => a.text)
			.join(" ");
	}
	return expr && ts.isStringLiteral(expr) ? expr.text : "";
}

/** The first `classNames={{ … }}` object literal in the file, if the component hands one to a library. */
function classNamesObject(sf: ts.SourceFile): ts.ObjectLiteralExpression | undefined {
	let found: ts.ObjectLiteralExpression | undefined;
	const visit = (node: ts.Node) => {
		if (found) return;
		const init = ts.isJsxAttribute(node) ? node.initializer : undefined;
		if (
			ts.isJsxAttribute(node) &&
			node.name.getText() === "classNames" &&
			init &&
			ts.isJsxExpression(init) &&
			init.expression &&
			ts.isObjectLiteralExpression(init.expression)
		) {
			found = init.expression;
			return;
		}
		ts.forEachChild(node, visit);
	};
	visit(sf);
	return found;
}

const unquote = (s: string) => s.replace(/^['"]|['"]$/g, "");

/** Current classes for every `classNames` surface (object key → classes). Empty if there is no object. */
export function readClassNames(source: string): Record<string, string> {
	const obj = classNamesObject(parse(source));
	const out: Record<string, string> = {};
	if (!obj) return out;
	for (const p of obj.properties) {
		if (ts.isPropertyAssignment(p))
			out[unquote(p.name.getText())] = classesFromValue(p.initializer);
	}
	return out;
}

/** Splice that rewrites a className value expression (cn(...) or a bare string) to `classes`. */
function spliceForValue(expr: ts.Expression, sf: ts.SourceFile, classes: string): Splice {
	const lit = JSON.stringify(classes);
	const cn = asCnCall(expr);
	if (cn) {
		let placed = false;
		const args: string[] = [];
		for (const a of cn.arguments) {
			if (ts.isStringLiteral(a)) {
				if (!placed) {
					args.push(lit);
					placed = true;
				}
			} else args.push(a.getText(sf));
		}
		if (!placed) args.unshift(lit);
		const all = cn.arguments;
		const first = all[0];
		const last = all[all.length - 1];
		if (!first || !last) return { start: all.pos, end: all.end, text: lit };
		return { start: first.getStart(sf), end: last.getEnd(), text: args.join(", ") };
	}
	if (ts.isStringLiteral(expr)) return { start: expr.getStart(sf), end: expr.getEnd(), text: lit };
	// No string literal to edit (e.g. a bare defaultClassNames.x) — wrap it so the edit has a home.
	return { start: expr.getStart(sf), end: expr.getEnd(), text: `cn(${lit}, ${expr.getText(sf)})` };
}

/** Write the given `classNames` surfaces back into the source, idempotently (mirrors writeSlots). */
export function writeClassNames(source: string, edits: Record<string, string>): string {
	const sf = parse(source);
	const obj = classNamesObject(sf);
	if (!obj) return source;
	const byKey = new Map(Object.entries(edits));
	const splices: Splice[] = [];
	for (const p of obj.properties) {
		if (!ts.isPropertyAssignment(p)) continue;
		const next = byKey.get(unquote(p.name.getText()));
		if (next !== undefined) splices.push(spliceForValue(p.initializer, sf, next));
	}
	splices.sort((a, b) => b.start - a.start);
	let out = source;
	for (const s of splices) out = out.slice(0, s.start) + s.text + out.slice(s.end);
	return out;
}
