import { Icon } from "@registry-ui/icon";

import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupText,
	InputGroupTextarea,
} from "~/components/ui/input-group";

export function InputGroupTextareaDemo() {
	return (
		<div className="grid w-full max-w-md gap-4">
			<InputGroup>
				<InputGroupTextarea
					id="textarea-code-32"
					placeholder="console.log('Hello, world!');"
					className="min-h-[200px]"
				/>
				<InputGroupAddon align="block-end" className="border-t">
					<InputGroupText>Line 1, Column 1</InputGroupText>
					<InputGroupButton size="sm" className="ml-auto" variant="default">
						Run <Icon icon="mdi:keyboard-return" />
					</InputGroupButton>
				</InputGroupAddon>
				<InputGroupAddon align="block-start" className="border-b">
					<InputGroupText className="font-mono font-medium">
						<Icon icon="mdi:language-javascript" />
						script.js
					</InputGroupText>
					<InputGroupButton className="ml-auto" size="icon-xs">
						<Icon icon="mdi:refresh" />
					</InputGroupButton>
					<InputGroupButton variant="ghost" size="icon-xs">
						<Icon icon="mdi:content-copy" />
					</InputGroupButton>
				</InputGroupAddon>
			</InputGroup>
		</div>
	);
}
