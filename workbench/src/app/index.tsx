import { createFileRoute } from "@tanstack/react-router";
import { EditorLayout } from "~/components/editor-layout";
import { ThemeControls } from "~/components/theme-controls";

export const Route = createFileRoute("/")({
	component: ThemeScope,
});

function ThemeScope() {
	return <EditorLayout controls={<ThemeControls />} />;
}
