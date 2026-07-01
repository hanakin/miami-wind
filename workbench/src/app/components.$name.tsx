import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SourcePanel } from "~/components/component-views";
import { CvaControls } from "~/components/cva-controls";
import { EditorLayout, EditorPreview } from "~/components/editor-layout";
import { OpenRender } from "~/components/open-renders";
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

// One component's editor: inspector on the left, live preview on the right. The selection (the cva
// target / variant / surface) is held here and shared with both panes, so picking a variant filters
// the preview and picking a state drives the controls. Custom primitives also show their source.
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
			variantStrip={
				<>
					<EditorPreview name={name} model={model} sel={sel} isCustom={isCustom} />
					<OpenRender name={name} />
					{isCustom && <SourcePanel name={name} />}
				</>
			}
		/>
	);
}
