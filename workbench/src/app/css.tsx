import { createFileRoute } from "@tanstack/react-router";
import { useTheme } from "~/stores/theme";

export const Route = createFileRoute("/css")({
	component: CustomCssScope,
});

// Fills the editor pane (not the sidebar) with the raw custom-CSS blob. Edits live in the theme
// store, so the Navbar's Save/Reset/"N unsaved" drive it; Save writes the theme item's `css` field
// and regenerates globals.css (CSS-HMR restyles the workbench).
function CustomCssScope() {
	const customCss = useTheme((s) => s.customCss);
	const setCustomCss = useTheme((s) => s.setCustomCss);
	return (
		<div className="flex h-full flex-col gap-2 p-4">
			<p className="shrink-0 text-xs text-subtext0">
				Custom global CSS — appended to <code className="text-subtext">globals.css</code> and
				shipped on the theme registry item's <code className="text-subtext">css</code> field. Use{" "}
				<code className="text-subtext">@layer base</code>,{" "}
				<code className="text-subtext">@utility</code>,{" "}
				<code className="text-subtext">@keyframes</code>, or arbitrary selectors. Save to apply.
			</p>
			<textarea
				value={customCss}
				onChange={(e) => setCustomCss(e.target.value)}
				spellCheck={false}
				placeholder={"@layer base {\n\ta { color: var(--color-primary); }\n}"}
				className="min-h-0 flex-1 resize-none rounded-md border border-border bg-mantle p-3 font-mono text-sm text-text outline-none focus-visible:border-primary"
			/>
		</div>
	);
}
