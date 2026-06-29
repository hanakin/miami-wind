import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { Sidebar } from "~/components/sidebar";
import { Toaster } from "~/components/ui/sonner";
import { TooltipProvider } from "~/components/ui/tooltip";
import { useDirtyCount, useInitOverrides, useSaveAll } from "~/hooks/use-workbench-data";
import { useTheme } from "~/stores/theme";

export interface RouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
	component: RootLayout,
});

function RootLayout() {
	useInitOverrides();
	const themeTokens = useTheme((s) => s.tokens);
	useEffect(() => {
		const el = document.documentElement;
		for (const t of themeTokens) el.style.setProperty(t.name, t.value);
	}, [themeTokens]);

	return (
		<TooltipProvider delayDuration={200}>
			<div className="flex h-screen flex-col bg-background text-foreground">
				<Toolbar />
				<div className="flex min-h-0 flex-1">
					<Sidebar />
					<main className="min-w-0 flex-1 overflow-y-auto">
						<Outlet />
					</main>
				</div>
			</div>
			<Toaster />
		</TooltipProvider>
	);
}

function Toolbar() {
	const dirty = useDirtyCount();
	const { saveAll, isPending } = useSaveAll();
	return (
		<header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
			<div className="flex items-center gap-2">
				<span className="size-3 rounded-full bg-primary" />
				<span className="font-semibold tracking-tight">Miami Wind</span>
				<span className="text-subtext0">·</span>
				<span className="text-subtext0">Workbench</span>
			</div>
			<div className="flex items-center gap-3">
				<span className="text-sm text-subtext0">
					{dirty > 0 ? `${dirty} unsaved cva${dirty > 1 ? "s" : ""}` : "All saved"}
				</span>
				<button
					type="button"
					disabled={dirty === 0 || isPending}
					onClick={saveAll}
					className="cursor-pointer rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-bright-pink disabled:cursor-not-allowed disabled:opacity-50"
				>
					{isPending ? "Saving…" : "Save all"}
				</button>
			</div>
		</header>
	);
}
