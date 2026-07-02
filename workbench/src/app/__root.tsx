import { Icon } from "@registry-ui/icon";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	Outlet,
	useNavigate,
	useParams,
	useRouterState,
} from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { previews } from "~/components/previews";
import { SceneTabs } from "~/components/scene-tabs";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Toaster } from "~/components/ui/sonner";
import { TooltipProvider } from "~/components/ui/tooltip";
import { useSaveTheme, useThemeData } from "~/hooks/use-theme-data";
import {
	useDirtyCount,
	useInitOverrides,
	usePrimitives,
	useSaveAll,
	useSaveSlots,
} from "~/hooks/use-workbench-data";
import { themeDirty, themeStore, useTheme } from "~/stores/theme";
import { useWorkbench, workbenchStore } from "~/stores/workbench";
import { cssForModels } from "~/utils/live-css";

export interface RouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
	component: RootLayout,
});

function RootLayout() {
	useInitOverrides();
	useThemeData();
	const themeTokens = useTheme((s) => s.tokens);
	useEffect(() => {
		const el = document.documentElement;
		for (const t of themeTokens) el.style.setProperty(t.name, t.value);
	}, [themeTokens]);

	// Live cva: resolve the working models to CSS and repaint a scoped stylesheet on every edit,
	// so class changes (opacity, colors, radius…) show instantly without Tailwind recompiling.
	// Slot edits on non-cva components aren't overlaid here — they're written to the custom component
	// file on Save and repaint via HMR (exact, no overlay/ship drift).
	useEffect(() => {
		const style = document.createElement("style");
		style.id = "live-cva";
		document.head.appendChild(style);
		const paint = () => {
			const s = workbenchStore.getState();
			style.textContent = cssForModels(s.models);
		};
		paint();
		const unsub = workbenchStore.subscribe(paint);
		return () => {
			unsub();
			style.remove();
		};
	}, []);

	// Live custom global CSS: mirror the editor blob into a <style> so it applies across the whole
	// workbench as you type and after Save — the same way tokens/cva preview live, instead of waiting
	// on a globals.css HMR that never fires for the API's out-of-band file write. Save still rewrites
	// globals.css for persistence/shipping. ponytail: raw <style> = native CSS only; Tailwind
	// directives (@utility/@apply/@theme) compile only on Save + reload, not in this live preview.
	useEffect(() => {
		const style = document.createElement("style");
		style.id = "custom-css";
		document.head.appendChild(style);
		const paint = () => {
			style.textContent = themeStore.getState().customCss;
		};
		paint();
		const unsub = themeStore.subscribe(paint);
		return () => {
			unsub();
			style.remove();
		};
	}, []);

	return (
		<TooltipProvider delayDuration={200}>
			<div className="flex h-screen flex-col bg-background text-foreground">
				<Navbar />
				<main className="min-h-0 flex-1">
					<Outlet />
				</main>
			</div>
			<Toaster />
		</TooltipProvider>
	);
}

function Navbar() {
	const cvaDirty = useDirtyCount();
	const themeIsDirty = useTheme(themeDirty);
	const tokens = useTheme((s) => s.tokens);
	const customCss = useTheme((s) => s.customCss);
	const saveTheme = useSaveTheme();
	const { saveAll } = useSaveAll();
	const { saveSlots, count: slotDirty } = useSaveSlots();
	const total = cvaDirty + (themeIsDirty ? 1 : 0) + slotDirty;
	const pending = saveTheme.isPending;

	const onSave = () => {
		if (themeIsDirty) saveTheme.mutate({ tokens, customCss });
		saveAll();
		if (slotDirty) saveSlots();
	};
	const onReset = () => {
		themeStore.getState().revert();
		const ws = workbenchStore.getState();
		for (const m of Object.values(ws.models)) ws.revert(m.exportName);
		ws.revertSlots();
	};

	return (
		<header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border px-4">
			<div className="flex items-center gap-3">
				<img src="/miami-wind.svg" alt="Miami Wind" className="size-11" />
				<span className="font-semibold tracking-tight">Miami Wind</span>
				<ScopeSelect />
				<SceneTabs />
			</div>
			<div className="flex items-center gap-2">
				<span className="text-sm text-subtext0">
					{total > 0 ? `${total} unsaved` : "All saved"}
				</span>
				<button
					type="button"
					disabled={total === 0}
					onClick={onReset}
					className="cursor-pointer rounded-md border border-border px-3 py-1.5 text-sm text-subtext transition-colors hover:bg-interactive hover:text-text disabled:cursor-not-allowed disabled:opacity-50"
				>
					Reset
				</button>
				<button
					type="button"
					disabled={total === 0 || pending}
					onClick={onSave}
					className="flex cursor-pointer items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-bright-pink disabled:cursor-not-allowed disabled:opacity-50"
				>
					<Icon icon="mdi:content-save-outline" size={15} />
					{pending ? "Saving…" : "Save"}
				</button>
			</div>
		</header>
	);
}

function ScopeSelect() {
	const navigate = useNavigate();
	const params = useParams({ strict: false }) as { name?: string };
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const current = pathname === "/css" ? "css" : (params.name ?? "theme");
	const primitives = usePrimitives();
	const custom = new Set(primitives.data?.custom ?? []);
	const models = useWorkbench((s) => s.models);
	const cvaNames = useMemo(() => new Set(Object.values(models).map((m) => m.name)), [models]);

	const names = Object.keys(previews).sort();
	const customNames = names.filter((n) => custom.has(n));
	const withCva = names.filter((n) => !custom.has(n) && cvaNames.has(n));
	const others = names.filter((n) => !custom.has(n) && !cvaNames.has(n));

	return (
		<Select
			value={current}
			onValueChange={(v) =>
				v === "theme"
					? navigate({ to: "/" })
					: v === "css"
						? navigate({ to: "/css" })
						: navigate({ to: "/components/$name", params: { name: v } })
			}
		>
			<SelectTrigger className="h-8 w-56">
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="theme">Theme</SelectItem>
				<SelectItem value="css">Custom CSS</SelectItem>
				{customNames.length > 0 && (
					<SelectGroup>
						<SelectLabel>Custom primitives</SelectLabel>
						{customNames.map((n) => (
							<SelectItem key={n} value={n}>
								{n}
							</SelectItem>
						))}
					</SelectGroup>
				)}
				<SelectGroup>
					<SelectLabel>With variants</SelectLabel>
					{withCva.map((n) => (
						<SelectItem key={n} value={n}>
							{n}
						</SelectItem>
					))}
				</SelectGroup>
				<SelectGroup>
					<SelectLabel>Components</SelectLabel>
					{others.map((n) => (
						<SelectItem key={n} value={n}>
							{n}
						</SelectItem>
					))}
				</SelectGroup>
			</SelectContent>
		</Select>
	);
}
