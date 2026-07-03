import { Icon } from "@registry-ui/icon";

import { Toggle } from "~/components/ui/toggle";

export function ToggleDemo() {
	return (
		<Toggle aria-label="Toggle bookmark" size="sm" variant="outline">
			<Icon icon="mdi:bookmark" />
			Bookmark
		</Toggle>
	);
}
