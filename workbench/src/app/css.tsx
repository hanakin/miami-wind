import { createFileRoute } from "@tanstack/react-router";
import { type KeyboardEvent, useRef } from "react";
import { highlight } from "sugar-high";
import { useTheme } from "~/stores/theme";

export const Route = createFileRoute("/css")({
	component: CustomCssScope,
});

// Fills the editor pane with the raw custom-CSS blob. Edits live in the theme store, so the Navbar's
// Save/Reset/"N unsaved" drive it; they apply live across the workbench (see __root) and, on Save,
// persist to the theme registry item's `css` field + globals.css.
function CustomCssScope() {
	const customCss = useTheme((s) => s.customCss);
	const setCustomCss = useTheme((s) => s.setCustomCss);
	return (
		<div className="flex h-full flex-col gap-2 p-4">
			<p className="shrink-0 text-xs text-subtext0">
				Custom global CSS — applied live across the workbench, appended to{" "}
				<code className="text-subtext">globals.css</code> and shipped on the theme registry item's{" "}
				<code className="text-subtext">css</code> field on Save.
			</p>
			<CssEditor value={customCss} onChange={setCustomCss} />
		</div>
	);
}

// Overlay editor: a transparent <textarea> (real caret + editing) sits exactly over an aria-hidden
// sugar-high <pre> that paints the colors. Identical font/size/leading/padding/wrap/tab-size on both
// so glyphs line up; scroll is mirrored. Tab inserts a real tab instead of moving focus.
function CssEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
	const taRef = useRef<HTMLTextAreaElement>(null);
	const preRef = useRef<HTMLPreElement>(null);
	const box =
		"m-0 p-3 font-mono text-sm leading-relaxed whitespace-pre-wrap break-words [tab-size:2]";

	const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key !== "Tab") return;
		e.preventDefault();
		const el = e.currentTarget;
		const start = el.selectionStart;
		onChange(`${value.slice(0, start)}\t${value.slice(el.selectionEnd)}`);
		requestAnimationFrame(() => {
			el.selectionStart = el.selectionEnd = start + 1;
		});
	};

	const syncScroll = () => {
		if (preRef.current && taRef.current) preRef.current.scrollTop = taRef.current.scrollTop;
	};

	return (
		<div className="relative min-h-0 flex-1 overflow-hidden rounded-md border border-border bg-mantle">
			<pre ref={preRef} aria-hidden className={`sh-code absolute inset-0 overflow-hidden ${box}`}>
				{/* biome-ignore lint/security/noDangerouslySetInnerHtml: sugar-high escapes; input is local editor text. */}
				<code dangerouslySetInnerHTML={{ __html: highlight(`${value}\n`) }} />
			</pre>
			<textarea
				ref={taRef}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				onKeyDown={onKeyDown}
				onScroll={syncScroll}
				spellCheck={false}
				placeholder={"button {\n\tcursor: pointer;\n}"}
				style={{ caretColor: "var(--color-text)" }}
				className={`absolute inset-0 resize-none overflow-auto bg-transparent text-transparent outline-none placeholder:text-subtext0 ${box}`}
			/>
		</div>
	);
}
