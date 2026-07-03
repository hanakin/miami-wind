import { Icon } from "@registry-ui/icon";

import { Badge } from "~/components/ui/badge";

export function BadgeVariants() {
	return (
		<div className="flex flex-wrap gap-2">
			<Badge variant="secondary">Secondary</Badge>
			<Badge variant="destructive">Destructive</Badge>
			<Badge variant="outline">Outline</Badge>
			<Badge variant="secondary">
				<Icon icon="mdi:check-circle" />
				Verified
			</Badge>
		</div>
	);
}
