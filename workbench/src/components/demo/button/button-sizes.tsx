import { Icon } from "@registry-ui/icon";

import { Button } from "~/components/ui/button";

export function ButtonSizes() {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<Button size="sm" variant="outline">
				<Icon icon="mdi:git" />
				Small
			</Button>
			<Button variant="outline">Default</Button>
			<Button size="lg" variant="outline">
				Large
			</Button>
			<Button size="icon" variant="outline" aria-label="Upload">
				<Icon icon="mdi:arrow-up" />
			</Button>
		</div>
	);
}
