import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { useEditorModel } from "~/stores/editor-model";

// InteractionMenu — the "which state of this piece do I edit" dropdown (editor rebuild, Stage 4).
//
// Two tiers, both derived from the pre-baked model (never a static list):
//   In this component — the states the piece really carries (edit them; controls populate)
//   Add              — the core states it doesn't have yet (create one)
// Real mechanism names, no CSS terms, no animation-only states (the reader already dropped those).

// The four design words (+ default) all capitalize cleanly, so the generic path covers them.
const label = (n: string) => n.charAt(0).toUpperCase() + n.slice(1);

export function InteractionMenu({
	name,
	pieceKey,
	value,
	onPick,
}: {
	name: string;
	pieceKey: string;
	value: string;
	onPick: (interaction: string) => void;
}) {
	// baseline is set once at launch, so this array reference is stable (no selector churn / loop).
	const interactions = useEditorModel((s) => s.baseline[name]?.interactionsByPiece[pieceKey]);
	if (!interactions?.length) return null;
	const present = interactions.filter((i) => i.present);
	const add = interactions.filter((i) => !i.present);

	return (
		<div className="flex flex-col gap-1.5">
			<span className="text-xs font-medium text-subtext0">Interaction</span>
			<Select value={value} onValueChange={(v) => onPick(v ?? "")}>
				<SelectTrigger className="h-8">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						<SelectLabel>In this component</SelectLabel>
						{present.map((i) => (
							<SelectItem key={i.name} value={i.name}>
								{label(i.name)}
							</SelectItem>
						))}
					</SelectGroup>
					{add.length > 0 && (
						<SelectGroup>
							<SelectLabel>Add</SelectLabel>
							{add.map((i) => (
								<SelectItem key={i.name} value={i.name}>
									{label(i.name)}
								</SelectItem>
							))}
						</SelectGroup>
					)}
				</SelectContent>
			</Select>
		</div>
	);
}
