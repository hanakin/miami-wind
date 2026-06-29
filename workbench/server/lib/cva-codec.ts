import * as ts from "typescript";
import { z } from "zod";

/**
 * cva-codec — parse a Miami Wind cva file into a structured model and serialize it back.
 *
 * Supported shape (the documented Miami Wind convention):
 *
 *   import { cva } from "class-variance-authority";
 *   const <local> = cva("<base>", {
 *     variants: { <axis>: { <option>: "<classes>" } },
 *     defaultVariants: { <axis>: "<option>" | true | false },
 *     compoundVariants: [{ <axis>: "<option>" | ["a","b"] | true, class: "<classes>" }],
 *   });
 *   export { <local> as <exportName> };
 *
 * Anything outside this shape (computed values, spreads, cx()) throws CvaParseError
 * rather than being silently mangled.
 */

export class CvaParseError extends Error {}

const conditionValue = z.union([z.string(), z.array(z.string()), z.boolean()]);

export const compoundVariantSchema = z.object({
	conditions: z.record(z.string(), conditionValue),
	class: z.string(),
});

export const cvaModelSchema = z.object({
	name: z.string(),
	localName: z.string(),
	exportName: z.string(),
	base: z.string(),
	variants: z.record(z.string(), z.record(z.string(), z.string())),
	defaultVariants: z.record(z.string(), z.union([z.string(), z.boolean()])),
	compoundVariants: z.array(compoundVariantSchema),
});

export type CvaModel = z.infer<typeof cvaModelSchema>;
export type CompoundVariant = z.infer<typeof compoundVariantSchema>;

// ---------------------------------------------------------------------------
// Parse
// ---------------------------------------------------------------------------

export function parseCva(source: string, name: string): CvaModel {
	const sf = ts.createSourceFile("cva.ts", source, ts.ScriptTarget.Latest, true);

	let localName: string | undefined;
	let call: ts.CallExpression | undefined;
	let exportName: string | undefined;

	const visit = (node: ts.Node): void => {
		if (ts.isVariableStatement(node)) {
			for (const decl of node.declarationList.declarations) {
				if (
					decl.initializer &&
					ts.isCallExpression(decl.initializer) &&
					ts.isIdentifier(decl.initializer.expression) &&
					decl.initializer.expression.text === "cva" &&
					ts.isIdentifier(decl.name)
				) {
					localName = decl.name.text;
					call = decl.initializer;
					const exported = node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
					if (exported) exportName = localName;
				}
			}
		}
		if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)) {
			for (const el of node.exportClause.elements) {
				const local = (el.propertyName ?? el.name).text;
				if (local === localName) exportName = el.name.text;
			}
		}
		ts.forEachChild(node, visit);
	};
	visit(sf);

	if (!call || !localName) {
		throw new CvaParseError(`No \`const <x> = cva(...)\` declaration found in ${name}.ts`);
	}
	const base = readString(call.arguments[0], name);
	const variants: CvaModel["variants"] = {};
	const defaultVariants: CvaModel["defaultVariants"] = {};
	const compoundVariants: CompoundVariant[] = [];

	const config = call.arguments[1];
	if (config) {
		if (!ts.isObjectLiteralExpression(config)) {
			throw new CvaParseError(`cva config must be an object literal in ${name}.ts`);
		}
		for (const prop of config.properties) {
			if (!ts.isPropertyAssignment(prop)) continue;
			const key = propKey(prop.name);
			if (key === "variants") readVariants(prop.initializer, variants, name);
			else if (key === "defaultVariants") readDefaults(prop.initializer, defaultVariants, name);
			else if (key === "compoundVariants") readCompound(prop.initializer, compoundVariants, name);
		}
	}

	return {
		name,
		localName,
		exportName: exportName ?? localName,
		base,
		variants,
		defaultVariants,
		compoundVariants,
	};
}

function readVariants(node: ts.Expression, out: CvaModel["variants"], name: string): void {
	if (!ts.isObjectLiteralExpression(node))
		throw new CvaParseError(`variants must be an object in ${name}.ts`);
	for (const axis of node.properties) {
		if (!ts.isPropertyAssignment(axis)) continue;
		const axisName = propKey(axis.name);
		if (!ts.isObjectLiteralExpression(axis.initializer)) {
			throw new CvaParseError(`variants.${axisName} must be an object in ${name}.ts`);
		}
		const options: Record<string, string> = {};
		for (const opt of axis.initializer.properties) {
			if (!ts.isPropertyAssignment(opt)) continue;
			options[propKey(opt.name)] = readString(opt.initializer, name);
		}
		out[axisName] = options;
	}
}

function readDefaults(node: ts.Expression, out: CvaModel["defaultVariants"], name: string): void {
	if (!ts.isObjectLiteralExpression(node))
		throw new CvaParseError(`defaultVariants must be an object in ${name}.ts`);
	for (const prop of node.properties) {
		if (!ts.isPropertyAssignment(prop)) continue;
		out[propKey(prop.name)] = readStringOrBool(prop.initializer, name);
	}
}

function readCompound(node: ts.Expression, out: CompoundVariant[], name: string): void {
	if (!ts.isArrayLiteralExpression(node))
		throw new CvaParseError(`compoundVariants must be an array in ${name}.ts`);
	for (const entry of node.elements) {
		if (!ts.isObjectLiteralExpression(entry)) continue;
		const conditions: CompoundVariant["conditions"] = {};
		let cls = "";
		for (const prop of entry.properties) {
			if (!ts.isPropertyAssignment(prop)) continue;
			const key = propKey(prop.name);
			if (key === "class" || key === "className") cls = readString(prop.initializer, name);
			else conditions[key] = readCondition(prop.initializer, name);
		}
		out.push({ conditions, class: cls });
	}
}

function readString(node: ts.Expression | undefined, name: string): string {
	if (node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)))
		return node.text;
	throw new CvaParseError(
		`Expected a string literal in ${name}.ts (got ${node ? ts.SyntaxKind[node.kind] : "nothing"})`,
	);
}

function readStringOrBool(node: ts.Expression, name: string): string | boolean {
	if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
	if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
	return readString(node, name);
}

function readCondition(node: ts.Expression, name: string): string | string[] | boolean {
	if (ts.isArrayLiteralExpression(node)) return node.elements.map((el) => readString(el, name));
	return readStringOrBool(node, name);
}

function propKey(name: ts.PropertyName): string {
	if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name))
		return name.text;
	throw new CvaParseError(`Unsupported property key: ${ts.SyntaxKind[name.kind]}`);
}

// ---------------------------------------------------------------------------
// Serialize (tab-indented, Miami Wind house style; a best-effort Biome pass refines it)
// ---------------------------------------------------------------------------

export function serializeCva(model: CvaModel): string {
	const out: string[] = [`import { cva } from "class-variance-authority";`, ""];

	const axes = Object.keys(model.variants);
	const defaults = Object.entries(model.defaultVariants);
	const hasConfig = axes.length > 0 || defaults.length > 0 || model.compoundVariants.length > 0;

	if (!hasConfig) {
		out.push(`const ${model.localName} = cva(${str(model.base)});`);
	} else {
		out.push(`const ${model.localName} = cva(`, `\t${str(model.base)},`, `\t{`);

		if (axes.length > 0) {
			out.push(`\t\tvariants: {`);
			for (const axis of axes) {
				out.push(`\t\t\t${key(axis)}: {`);
				for (const [opt, cls] of Object.entries(model.variants[axis] ?? {})) {
					out.push(`\t\t\t\t${key(opt)}: ${str(cls)},`);
				}
				out.push(`\t\t\t},`);
			}
			out.push(`\t\t},`);
		}

		if (defaults.length > 0) {
			const inline = defaults.map(([k, v]) => `${key(k)}: ${lit(v)}`).join(", ");
			out.push(`\t\tdefaultVariants: { ${inline} },`);
		}

		if (model.compoundVariants.length > 0) {
			out.push(`\t\tcompoundVariants: [`);
			for (const cv of model.compoundVariants) {
				const conds = Object.entries(cv.conditions).map(([k, v]) => `${key(k)}: ${cond(v)}`);
				out.push(`\t\t\t{ ${[...conds, `class: ${str(cv.class)}`].join(", ")} },`);
			}
			out.push(`\t\t],`);
		}

		out.push(`\t},`, `);`);
	}

	out.push("");
	out.push(
		model.exportName === model.localName
			? `export { ${model.localName} };`
			: `export { ${model.localName} as ${model.exportName} };`,
	);
	return `${out.join("\n")}\n`;
}

const IDENT = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const key = (k: string): string => (IDENT.test(k) ? k : JSON.stringify(k));
const str = (s: string): string => JSON.stringify(s);
const lit = (v: string | boolean): string =>
	typeof v === "string" ? JSON.stringify(v) : String(v);
const cond = (v: string | string[] | boolean): string =>
	Array.isArray(v) ? `[${v.map((s) => JSON.stringify(s)).join(", ")}]` : lit(v);
