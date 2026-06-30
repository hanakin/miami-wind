import { createFileRoute } from "@tanstack/react-router";
import { SourcePanel } from "~/components/component-views";
import { CvaControls } from "~/components/cva-controls";
import { EditorLayout, VariantStrip } from "~/components/editor-layout";
import { useComponentModel, useEnsureModel, usePrimitives } from "~/hooks/use-workbench-data";

export const Route = createFileRoute("/components/$name")({
	component: ComponentScope,
});

// Every component — cva, non-cva, or custom — gets the same editor: inspector on the left, the
// live component (states + variants) on the right. Custom primitives also show their source under
// the preview. Non-cva/custom seed an empty model so they're customizable the same way.
function ComponentScope() {
	const { name } = Route.useParams();
	useEnsureModel(name);
	const model = useComponentModel(name);
	const primitives = usePrimitives();
	const isCustom = primitives.data?.custom.includes(name) ?? false;

	if (!model) return null;
	return (
		<EditorLayout
			controls={<CvaControls key={name} name={name} />}
			variantStrip={
				<>
					<VariantStrip name={name} model={model} isCustom={isCustom} />
					{isCustom && <SourcePanel name={name} />}
				</>
			}
		/>
	);
}
