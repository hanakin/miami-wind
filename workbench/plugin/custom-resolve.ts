import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { Plugin } from "vite";

// custom-resolve — render the registry's custom component instead of the vendored vanilla.
//
// Previews import `~/components/ui/<name>`, which aliases to the workbench's vendored vanilla shadcn.
// Once a primitive is promoted (its full source vendored into registry/components/ui/<name>.tsx), the
// workbench should render *that* — so what you edit is what you see is what ships. This intercepts the
// bare specifier before the `~` alias and redirects to the registry file when it exists; otherwise it
// falls through to the vanilla. The registry dir is under the dev server's fs.allow, so edits HMR.

const SPEC = /^~\/components\/ui\/([a-z0-9-]+)$/;
const REGISTRY_UI = resolve(import.meta.dirname, "..", "..", "registry", "components", "ui");

export function customResolve(): Plugin {
	return {
		name: "mw-custom-resolve",
		enforce: "pre",
		resolveId(id) {
			const m = id.match(SPEC);
			if (!m) return null;
			const custom = resolve(REGISTRY_UI, `${m[1]}.tsx`);
			return existsSync(custom) ? custom : null;
		},
	};
}

export default customResolve;
