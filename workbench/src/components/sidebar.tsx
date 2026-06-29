import { Link } from "@tanstack/react-router";
import { previews } from "~/components/previews";
import { useDirtyByName, useHasCva, usePrimitives } from "~/hooks/use-workbench-data";

export function Sidebar() {
	const primitives = usePrimitives();
	const custom = new Set(primitives.data?.custom ?? []);
	const names = Object.keys(previews).sort();
	const customNames = names.filter((n) => custom.has(n));
	const shadcnNames = names.filter((n) => !custom.has(n));

	return (
		<nav className="flex w-60 shrink-0 flex-col overflow-y-auto border-r border-border bg-sidebar p-3">
			<Link
				to="/"
				className="flex cursor-pointer items-center rounded-md px-3 py-2 text-sm font-medium text-subtext transition-colors hover:bg-interactive hover:text-text data-[status=active]:bg-interactive data-[status=active]:text-text"
				activeOptions={{ exact: true }}
			>
				All components
			</Link>
			<Link
				to="/theme"
				className="mb-1 flex cursor-pointer items-center rounded-md px-3 py-2 text-sm font-medium text-subtext transition-colors hover:bg-interactive hover:text-text data-[status=active]:bg-interactive data-[status=active]:text-text"
			>
				Theme
			</Link>
			{customNames.length > 0 && <Group title="Custom" names={customNames} />}
			<Group title="shadcn" names={shadcnNames} />
		</nav>
	);
}

function Group({ title, names }: { title: string; names: string[] }) {
	return (
		<div className="mt-3">
			<div className="px-3 pb-1 text-xs font-medium uppercase tracking-wide text-subtext0">
				{title}
			</div>
			{names.map((name) => (
				<Item key={name} name={name} />
			))}
		</div>
	);
}

function Item({ name }: { name: string }) {
	const dirty = useDirtyByName(name);
	const hasCva = useHasCva(name);
	return (
		<Link
			to="/components/$name"
			params={{ name }}
			className="group flex cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-1.5 text-sm text-subtext transition-colors hover:bg-interactive hover:text-text data-[status=active]:bg-interactive data-[status=active]:text-text"
		>
			<span className="truncate">{name}</span>
			<span className="flex shrink-0 items-center gap-1.5">
				{hasCva && <span className="text-[10px] text-subtext0">cva</span>}
				{dirty && (
					<span
						className="size-1.5 rounded-full bg-primary"
						role="img"
						aria-label="Unsaved changes"
					/>
				)}
			</span>
		</Link>
	);
}
