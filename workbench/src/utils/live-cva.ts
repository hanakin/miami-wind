import { cva } from "class-variance-authority";
import type { CompoundVariant, CvaModel } from "../../server/lib/cva-codec";
import { workbenchStore } from "../stores/workbench";

/**
 * Runtime target of the live-cva plugin's swap. Registers the primitive's vanilla
 * default as a seed, then returns a function that builds classes from the *current*
 * working model in the store — so previews update live and never touch disk.
 */

type LooseConfig = {
	variants?: Record<string, Record<string, unknown>>;
	defaultVariants?: Record<string, unknown>;
	compoundVariants?: Array<Record<string, unknown>>;
};

type VariantProps = Record<string, string | boolean | null | undefined>;
type VariantFn = (props?: VariantProps) => string;

export function __liveCva(
	symbol: string,
	file: string,
	base: string,
	config?: LooseConfig,
): VariantFn {
	workbenchStore.getState().registerSeed(symbol, modelFromCva(symbol, file, base, config));
	return (props) => {
		const model = workbenchStore.getState().models[symbol];
		return buildCva(model ?? modelFromCva(symbol, file, base, config))(props);
	};
}

// cva's generics reject our fully-dynamic config; treat it as a loose factory at this one boundary.
const make = cva as unknown as (base: string, config?: unknown) => VariantFn;

function buildCva(model: CvaModel): VariantFn {
	return make(model.base, {
		variants: model.variants,
		defaultVariants: model.defaultVariants,
		compoundVariants: model.compoundVariants.map((cv) => ({ ...cv.conditions, class: cv.class })),
	});
}

const camel = (s: string): string => s.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
const text = (v: unknown): string => (Array.isArray(v) ? v.map(String).join(" ") : String(v));

/** Convert the vanilla `cva(base, config)` arguments into a structured CvaModel seed. */
function modelFromCva(symbol: string, file: string, base: string, config?: LooseConfig): CvaModel {
	const variants: CvaModel["variants"] = {};
	const defaultVariants: CvaModel["defaultVariants"] = {};
	const compoundVariants: CompoundVariant[] = [];

	for (const [axis, options] of Object.entries(config?.variants ?? {})) {
		const out: Record<string, string> = {};
		for (const [option, value] of Object.entries(options)) out[option] = text(value);
		variants[axis] = out;
	}
	for (const [axis, value] of Object.entries(config?.defaultVariants ?? {})) {
		defaultVariants[axis] = typeof value === "boolean" ? value : text(value);
	}
	for (const entry of config?.compoundVariants ?? []) {
		const { class: cls, className, ...rest } = entry;
		const conditions: CompoundVariant["conditions"] = {};
		for (const [axis, value] of Object.entries(rest)) {
			conditions[axis] = Array.isArray(value)
				? value.map(String)
				: typeof value === "boolean"
					? value
					: text(value);
		}
		compoundVariants.push({ conditions, class: text(cls ?? className ?? "") });
	}

	return {
		name: file,
		localName: camel(file),
		exportName: symbol,
		base,
		variants,
		defaultVariants,
		compoundVariants,
	};
}
