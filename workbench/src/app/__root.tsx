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
import { demoComponentNames } from "~/components/demo-scene";
import { SceneTabs } from "~/components/scene-tabs";
import { Button } from "~/components/ui/button";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { Toaster } from "~/components/ui/sonner";
import { Toggle } from "~/components/ui/toggle";
import { TooltipProvider } from "~/components/ui/tooltip";
import { useSaveTheme, useThemeData } from "~/hooks/use-theme-data";
import {
	useDirtyCount,
	useInitEditorModels,
	useInitOverrides,
	usePrimitives,
	useSaveAll,
	useSaveSlots,
} from "~/hooks/use-workbench-data";
import { exposeStore, useExpose } from "~/stores/expose";
import { reviewStore, useReview } from "~/stores/review";
import { themeDirty, themeStore, useTheme } from "~/stores/theme";
import { useWorkbench, workbenchStore } from "~/stores/workbench";
import { cssForModels, cssForSlots } from "~/utils/live-css";

export interface RouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
	component: RootLayout,
});

function RootLayout() {
	useInitOverrides();
	useInitEditorModels();
	useThemeData();
	const themeTokens = useTheme((s) => s.tokens);
	useEffect(() => {
		const el = document.documentElement;
		for (const t of themeTokens) el.style.setProperty(t.name, t.value);
	}, [themeTokens]);

	// Live cva + slots: resolve the working models AND per-slot edits to CSS and repaint a scoped
	// stylesheet on every edit, so class changes (opacity, colors, radius…) show instantly without
	// Tailwind recompiling. Slots are appended after models so an explicit slot edit wins over a cva
	// rule on the same element. Save still rewrites the real files (cva / custom component); the overlay
	// just closes the pre-Save gap so the round-trip shows live.
	useEffect(() => {
		const style = document.createElement("style");
		style.id = "live-cva";
		document.head.appendChild(style);
		const paint = () => {
			const s = workbenchStore.getState();
			style.textContent = `${cssForModels(s.models)}\n${cssForSlots(s.slots)}`;
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
		<TooltipProvider delay={200}>
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
		<header className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-4 py-3">
			<div className="flex items-center gap-3">
				<img src="/miami-wind.svg" alt="Miami Wind" className="size-11" />
				<span className="font-semibold tracking-tight">Miami Wind</span>
				<ScopeSelect />
				<SceneTabs />
			</div>
			<div className="flex items-center gap-2">
				{/* Mode toggles — flip a preview mode on/off (per component route). */}
				<ExposeToggle />
				<ReviewToggle />

				<Separator orientation="vertical" className="mx-1 h-6" />

				{/* Save cluster — dirty status, then its actions. Reset discards unsaved work (destructive). */}
				<span className="text-sm tabular-nums text-muted-foreground">
					{total > 0 ? `${total} unsaved` : "All saved"}
				</span>
				<Button variant="destructive" size="sm" disabled={total === 0} onClick={onReset}>
					Reset
				</Button>
				<Button size="sm" disabled={total === 0 || pending} onClick={onSave}>
					<Icon icon="mdi:content-save-outline" size={15} />
					{pending ? "Saving…" : "Save"}
				</Button>
			</div>
		</header>
	);
}

// Review-mode toggle: flips the annotation overlay on/off (mounted per component route) and shows the
// running note count. A real toggle (aria-pressed) — read-only, it never edits a component or demo.
function ReviewToggle() {
	const on = useReview((s) => s.on);
	const count = useReview((s) => s.notes.length);
	return (
		<Toggle
			variant="outline"
			size="sm"
			pressed={on}
			onPressedChange={() => reviewStore.getState().toggle()}
		>
			<Icon icon="mdi:comment-edit-outline" size={15} />
			Review
			{count > 0 && (
				<span className="rounded-full bg-foreground/10 px-1.5 text-xs tabular-nums">{count}</span>
			)}
		</Toggle>
	);
}

// Expose-mode toggle: flips the exposure overlay on/off (mounted per component route). While on, click a
// raw, un-tagged node in the preview to promote it to a data-slot the editor can style. A real toggle.
function ExposeToggle() {
	const on = useExpose((s) => s.on);
	return (
		<Toggle
			variant="outline"
			size="sm"
			pressed={on}
			onPressedChange={() => exposeStore.getState().toggle()}
		>
			<Icon icon="mdi:cursor-default-click-outline" size={15} />
			Expose
		</Toggle>
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
	// Group by REAL cva presence (actual base/variants), not the blank seed useEnsureModel gives every
	// visited component — otherwise selecting a non-cva component registers a seed and jumps it from
	// "Components" into "With variants" under the cursor (E7/SYNC). Mirrors the `cvas` filter in
	// cva-controls, and every real cva is seeded at load (demos glob-import eagerly), so this is stable.
	const cvaNames = useMemo(
		() =>
			new Set(
				Object.values(models)
					.filter((m) => m.base.trim() !== "" || Object.keys(m.variants).length > 0)
					.map((m) => m.name),
			),
		[models],
	);

	const names = [...new Set([...demoComponentNames, ...custom])].sort();
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
						: navigate({ to: "/components/$name", params: { name: v ?? "" } })
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
