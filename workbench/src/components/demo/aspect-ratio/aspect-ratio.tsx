import { AspectRatio } from "~/components/ui/aspect-ratio";

export function AspectRatioDemo() {
	return (
		<div className="w-80 shrink-0">
			<AspectRatio ratio={16 / 9} className="overflow-hidden rounded-lg bg-muted">
				<img
					src="https://github.com/shadcn.png"
					alt="Cover"
					className="h-full w-full object-cover"
				/>
			</AspectRatio>
		</div>
	);
}
