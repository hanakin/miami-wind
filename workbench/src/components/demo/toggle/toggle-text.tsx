import { Icon } from "@registry-ui/icon";

import { Toggle } from "~/components/ui/toggle";

export function ToggleText() {
	return (
		<Toggle aria-label="Toggle italic">
			<Icon icon="mdi:format-italic" />
			Italic
		</Toggle>
	);
}
