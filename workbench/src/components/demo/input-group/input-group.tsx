import { Icon } from "@registry-ui/icon";

import { InputGroup, InputGroupAddon, InputGroupInput } from "~/components/ui/input-group";

export function InputGroupDemo() {
	return (
		<InputGroup>
			<InputGroupInput placeholder="Search..." />
			<InputGroupAddon>
				<Icon icon="mdi:magnify" />
			</InputGroupAddon>
		</InputGroup>
	);
}
