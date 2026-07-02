import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SourcePanel } from "~/components/component-views";
import { CvaControls } from "~/components/cva-controls";
import { DemoScene } from "~/components/demo-scene";
import { EditorLayout } from "~/components/editor-layout";
import {
	useComponentModel,
	useComponentSlots,
	useEnsureModel,
	usePrimitives,
} from "~/hooks/use-workbench-data";
import { initialSelection, type Selection } from "~/utils/editor-selection";

export const Route = createFileRoute("/components/$name")({
	component: ComponentScope,
});

// Remount per component (key) so the editor's selection resets when you switch components.
function ComponentScope() {
	const { name } = Route.useParams();
	return <ComponentEditor key={name} name={name} />;
}

// One component's editor: controls on the left; on the right, the component's demos with the focused
// filter (slot / variant / context) beneath them. Custom primitives also show their read-only source.
function ComponentEditor({ name }: { name: string }) {
	useEnsureModel(name);
	useComponentSlots(name);
	const model = useComponentModel(name);
	const primitives = usePrimitives();
	const isCustom = primitives.data?.custom.includes(name) ?? false;
	const [sel, setSel] = useState<Selection>(() => initialSelection(model));

	if (!model) return null;
	return (
		<EditorLayout
			controls={<CvaControls name={name} sel={sel} onSel={setSel} />}
			preview={
				<div className="flex h-full min-h-0 flex-col overflow-auto">
					<DemoScene name={name} sel={sel} />
					{isCustom && <SourcePanel name={name} />}
				</div>
			}
		/>
	);
}
