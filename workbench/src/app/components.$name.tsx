import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CvaEditor } from "~/components/cva-editor";
import { previews } from "~/components/previews";
import { VariantsTable } from "~/components/variants-table";
import {
	useComponentModel,
	useDeleteCva,
	usePrimitives,
	useSaveCva,
} from "~/hooks/use-workbench-data";
import { isDirty, useWorkbench, workbenchStore } from "~/stores/workbench";
import { setTargetClass, type Target } from "~/utils/cva-edit";

export const Route = createFileRoute("/components/$name")({
	component: ComponentDetail,
});

const PRIMARY_BTN =
	"cursor-pointer rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-bright-pink disabled:cursor-not-allowed disabled:opacity-50";
const GHOST_BTN =
	"cursor-pointer rounded-md border border-border px-3 py-1.5 text-sm text-subtext transition-colors hover:bg-interactive hover:text-text disabled:cursor-not-allowed disabled:opacity-50";

function ComponentDetail() {
	const { name } = Route.useParams();
	const model = useComponentModel(name);
	const symbol = model?.exportName;
	const dirty = useWorkbench((s) => (symbol ? isDirty(s, symbol) : false));
	const primitives = usePrimitives();
	const hasOverride = primitives.data?.cvas.includes(name) ?? false;
	const save = useSaveCva();
	const del = useDeleteCva();
	const [selected, setSelected] = useState<Target>({ kind: "base" });

	if (!model || !symbol) return <PreviewOnly name={name} />;

	const updateClass = (value: string) =>
		workbenchStore.getState().setModel(symbol, setTargetClass(model, selected, value));

	return (
		<div className="flex h-full flex-col">
			<header className="flex items-center justify-between gap-4 border-b border-border px-6 py-3">
				<div className="flex items-center gap-2">
					<h1 className="text-lg font-semibold tracking-tight">{name}</h1>
					{dirty && (
						<span className="rounded bg-interactive px-1.5 py-0.5 text-[10px] font-medium text-subtext0">
							unsaved
						</span>
					)}
				</div>
				<div className="flex items-center gap-2">
					<button
						type="button"
						disabled={!dirty}
						onClick={() => workbenchStore.getState().revert(symbol)}
						className={GHOST_BTN}
					>
						Revert
					</button>
					{hasOverride && (
						<button type="button" onClick={() => del.mutate(model)} className={GHOST_BTN}>
							{del.isPending ? "Deleting…" : "Delete cva"}
						</button>
					)}
					<button
						type="button"
						disabled={!dirty || save.isPending}
						onClick={() => save.mutate(model)}
						className={PRIMARY_BTN}
					>
						{save.isPending ? "Saving…" : hasOverride ? "Save cva" : "Create cva"}
					</button>
				</div>
			</header>
			<div className="grid min-h-0 flex-1 grid-cols-[1fr_360px]">
				<div className="overflow-auto p-6">
					<VariantsTable model={model} selected={selected} onSelect={setSelected} />
				</div>
				<div className="min-h-0 overflow-hidden border-l border-border bg-card">
					<CvaEditor
						model={model}
						selected={selected}
						onSelect={setSelected}
						onChangeClass={updateClass}
					/>
				</div>
			</div>
		</div>
	);
}

function PreviewOnly({ name }: { name: string }) {
	const render = previews[name];
	const [icon, setIcon] = useState("mdi:home");
	const [size, setSize] = useState(48);
	const isIcon = name === "icon";

	return (
		<div className="flex h-full flex-col">
			<header className="border-b border-border px-6 py-3">
				<h1 className="text-lg font-semibold tracking-tight">{name}</h1>
				<p className="mt-0.5 text-sm text-subtext0">
					{isIcon ? "Custom primitive — preview only." : "No cva layer — preview only."}
				</p>
			</header>
			<div className="grid flex-1 place-items-center p-6">
				{render?.(isIcon ? { icon, size } : undefined)}
			</div>
			{isIcon && (
				<div className="flex items-end gap-4 border-t border-border p-6">
					<label className="flex flex-col gap-1 text-xs text-subtext0">
						icon
						<input
							value={icon}
							onChange={(e) => setIcon(e.target.value)}
							className="w-56 rounded-md border border-border bg-input px-2 py-1.5 font-mono text-xs text-text outline-none focus-visible:border-primary"
						/>
					</label>
					<label className="flex flex-col gap-1 text-xs text-subtext0">
						size
						<input
							type="number"
							value={size}
							onChange={(e) => setSize(Number(e.target.value))}
							className="w-24 rounded-md border border-border bg-input px-2 py-1.5 text-xs text-text outline-none focus-visible:border-primary"
						/>
					</label>
				</div>
			)}
		</div>
	);
}
