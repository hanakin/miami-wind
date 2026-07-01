import type { ReactNode } from "react";

// Two-pane editor: controls on the left, a preview pane on the right. The route supplies the pane —
// the theme route passes the scene canvas, a component route passes its example preview.
export function EditorLayout({ controls, preview }: { controls: ReactNode; preview: ReactNode }) {
	return (
		<div className="grid h-full grid-cols-[340px_1fr]">
			<aside className="min-h-0 overflow-auto border-r border-border bg-mantle">{controls}</aside>
			{preview}
		</div>
	);
}
