import { Icon } from "@registry-ui/icon";

import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";

export function ToggleGroupDemo() {
	return (
		<ToggleGroup variant="outline">
			<ToggleGroupItem value="bold" aria-label="Toggle bold">
				<Icon icon="mdi:format-bold" />
			</ToggleGroupItem>
			<ToggleGroupItem value="italic" aria-label="Toggle italic">
				<Icon icon="mdi:format-italic" />
			</ToggleGroupItem>
			<ToggleGroupItem value="strikethrough" aria-label="Toggle strikethrough">
				<Icon icon="mdi:format-underline" />
			</ToggleGroupItem>
		</ToggleGroup>
	);
}
