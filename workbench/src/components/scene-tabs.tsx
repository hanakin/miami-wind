import { useRouterState } from "@tanstack/react-router";
import { SCENES, useScene } from "~/stores/scene";
import { cn } from "~/utils/cn";

// The preview scene selector, in the navbar next to the scope dropdown. Hidden on the Custom CSS
// scope, which is a full-pane editor with no preview.
export function SceneTabs() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const scene = useScene((s) => s.scene);
	const setScene = useScene((s) => s.setScene);
	if (pathname === "/css") return null;
	return (
		<div className="flex items-center gap-1 border-l border-border pl-3">
			{SCENES.map((s) => (
				<button
					key={s.key}
					type="button"
					onClick={() => setScene(s.key)}
					className={cn(
						"cursor-pointer rounded-md px-3 py-1.5 text-sm transition-colors",
						scene === s.key ? "bg-interactive text-text" : "text-subtext0 hover:text-text",
					)}
				>
					{s.label}
				</button>
			))}
		</div>
	);
}
