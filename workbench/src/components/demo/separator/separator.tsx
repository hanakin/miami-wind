import { Separator } from "~/components/ui/separator";

export function SeparatorDemo() {
	return (
		<div className="w-64">
			<div className="text-sm">Above</div>
			<Separator className="my-2" />
			<div className="text-sm">Below</div>
		</div>
	);
}
