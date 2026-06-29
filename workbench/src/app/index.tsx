import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { previews } from "~/components/previews";
import { useDirtyByName, useHasCva, usePrimitives } from "~/hooks/use-workbench-data";

export const Route = createFileRoute("/")({
	component: Home,
});

function Home() {
	const primitives = usePrimitives();
	const custom = new Set(primitives.data?.custom ?? []);
	const names = Object.keys(previews).sort();

	return (
		<div className="p-6">
			<header className="mb-6">
				<h1 className="text-2xl font-semibold tracking-tight">Components</h1>
				<p className="mt-1 text-sm text-subtext0">
					{names.length} primitives · select one to edit its variants and classes.
				</p>
			</header>
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
				{names.map((name) => (
					<ComponentCard key={name} name={name} isCustom={custom.has(name)} />
				))}
			</div>
		</div>
	);
}

function ComponentCard({ name, isCustom }: { name: string; isCustom: boolean }) {
	const dirty = useDirtyByName(name);
	const hasCva = useHasCva(name);
	const render = previews[name];

	return (
		<div className="group relative flex min-h-44 flex-col overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-primary">
			<Link
				to="/components/$name"
				params={{ name }}
				aria-label={name}
				className="absolute inset-0 z-10 cursor-pointer"
			/>
			<div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
				<span className="truncate text-sm font-medium">{name}</span>
				<span className="flex shrink-0 items-center gap-1.5">
					{isCustom && <Tag>custom</Tag>}
					{hasCva && <Tag>cva</Tag>}
					{dirty && (
						<span
							className="size-1.5 rounded-full bg-primary"
							role="img"
							aria-label="Unsaved changes"
						/>
					)}
				</span>
			</div>
			<div className="pointer-events-none grid flex-1 place-items-center overflow-hidden p-4">
				{render?.()}
			</div>
		</div>
	);
}

function Tag({ children }: { children: ReactNode }) {
	return (
		<span className="rounded bg-interactive px-1.5 py-0.5 text-[10px] font-medium text-subtext0">
			{children}
		</span>
	);
}
