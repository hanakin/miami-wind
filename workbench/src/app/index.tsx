import { createFileRoute } from "@tanstack/react-router";
import { EditorLayout } from "~/components/editor-layout";
import { PreviewCanvas } from "~/components/preview-canvas";
import { ThemeControls } from "~/components/theme-controls";

export const Route = createFileRoute("/")({
	component: ThemeScope,
});

function ThemeScope() {
	return <EditorLayout controls={<ThemeControls />} preview={<PreviewCanvas />} />;
}
