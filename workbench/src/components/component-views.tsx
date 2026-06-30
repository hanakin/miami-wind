import { useComponentSource } from "~/hooks/use-workbench-data";

// Custom primitives are previewed live on the canvas like any other component; their read-only
// source is shown underneath it (they have no variant layer to parse, so the file is the truth).
export function SourcePanel({ name }: { name: string }) {
	const source = useComponentSource(name);
	const code = source.data && "source" in source.data ? source.data.source : null;
	return (
		<div className="mb-6 flex flex-col gap-2 border-b border-border pb-6">
			<span className="text-xs font-medium uppercase tracking-wide text-subtext0">Source</span>
			<pre className="max-h-[28rem] overflow-auto rounded-md border border-border bg-base p-3 text-[11px] leading-relaxed text-subtext">
				<code>{code ?? "Loading…"}</code>
			</pre>
		</div>
	);
}
