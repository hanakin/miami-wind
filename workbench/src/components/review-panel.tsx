import { Icon } from "@registry-ui/icon";
import { useState } from "react";
import { toast } from "sonner";
import { type ReviewNote, reviewStore, useReview } from "~/stores/review";

// The Review-mode side list: every note for the current component, each editable + deletable, sharing its
// pin number. Export copies ALL notes (every component) as grouped markdown. Visible only when review is on.
export function ReviewPanel({ component }: { component: string }) {
	const on = useReview((s) => s.on);
	const notes = useReview((s) => s.notes);
	// Clipboard fallback (plan A5): if the async copy is blocked, drop the markdown into a readonly
	// textarea to select by hand.
	const [fallback, setFallback] = useState<string | null>(null);

	if (!on) return null;
	const rows = notes.filter((n) => n.component === component);

	const onExport = () => {
		const md = exportMarkdown(notes);
		if (!md) {
			toast("No review notes yet");
			return;
		}
		navigator.clipboard.writeText(md).then(
			() => toast("Review notes copied"),
			() => setFallback(md),
		);
	};

	return (
		<div className="fixed right-4 bottom-4 z-50 flex max-h-[70vh] w-80 flex-col rounded-lg border border-border bg-mantle shadow-xl">
			<div className="flex items-center justify-between border-b border-border px-3 py-2">
				<span className="text-sm font-medium">Notes · {rows.length}</span>
				<button
					type="button"
					onClick={onExport}
					className="flex cursor-pointer items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-subtext transition-colors hover:bg-interactive hover:text-text"
				>
					<Icon icon="mdi:export-variant" size={13} />
					Export
				</button>
			</div>
			{fallback !== null ? (
				<div className="flex flex-col gap-2 p-3">
					<span className="text-xs text-subtext0">Copy failed — select and copy:</span>
					<textarea
						readOnly
						value={fallback}
						onFocus={(e) => e.currentTarget.select()}
						className="h-40 resize-none rounded border border-border bg-background p-2 font-mono text-[11px]"
					/>
					<button
						type="button"
						onClick={() => setFallback(null)}
						className="cursor-pointer self-end text-xs text-subtext hover:text-text"
					>
						Close
					</button>
				</div>
			) : (
				<div className="min-h-0 flex-1 overflow-auto">
					{rows.length === 0 ? (
						<p className="p-3 text-xs text-subtext0">Click a piece in the preview to add a note.</p>
					) : (
						rows.map((n, i) => (
							<div key={n.id} className="flex gap-2 border-b border-border/50 px-3 py-2">
								<span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
									{i + 1}
								</span>
								<div className="flex min-w-0 flex-1 flex-col gap-1">
									<span className="truncate font-mono text-[10px] text-subtext0">
										{n.view} · {n.demo || "—"} · {n.piece || "—"}
									</span>
									<textarea
										value={n.text}
										placeholder="Note…"
										onChange={(e) => reviewStore.getState().setText(n.id, e.target.value)}
										className="min-h-8 resize-none rounded border border-border bg-background px-2 py-1 text-xs"
									/>
								</div>
								<button
									type="button"
									aria-label="Delete note"
									onClick={() => reviewStore.getState().remove(n.id)}
									className="mt-0.5 shrink-0 cursor-pointer text-subtext0 transition-colors hover:text-red"
								>
									<Icon icon="mdi:trash-can-outline" size={14} />
								</button>
							</div>
						))
					)}
				</div>
			)}
		</div>
	);
}

// Grouped markdown: one `## <component>` section, `- [<view> · <demo> · <piece>] <text>` per note.
export function exportMarkdown(notes: ReviewNote[]): string {
	const byComp = new Map<string, ReviewNote[]>();
	for (const n of notes) {
		const list = byComp.get(n.component) ?? [];
		list.push(n);
		byComp.set(n.component, list);
	}
	return [...byComp.entries()]
		.map(
			([comp, list]) =>
				`## ${comp}\n${list
					.map((n) => `- [${n.view} · ${n.demo || "—"} · ${n.piece || "—"}] ${n.text}`)
					.join("\n")}`,
		)
		.join("\n\n");
}
