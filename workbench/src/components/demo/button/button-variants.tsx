import { Button } from "~/components/ui/button";

export function ButtonVariants() {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<Button variant="default">Default</Button>
			<Button variant="secondary">Secondary</Button>
			<Button variant="destructive">Destructive</Button>
			<Button variant="outline">Outline</Button>
			<Button variant="ghost">Ghost</Button>
			<Button variant="link">Link</Button>
		</div>
	);
}
