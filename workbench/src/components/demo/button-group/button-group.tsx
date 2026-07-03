import { Button } from "~/components/ui/button";
import { ButtonGroup, ButtonGroupSeparator } from "~/components/ui/button-group";

export function ButtonGroupDemo() {
	return (
		<ButtonGroup orientation="horizontal">
			<Button variant="secondary" size="sm">
				Copy
			</Button>
			<ButtonGroupSeparator />
			<Button variant="secondary" size="sm">
				Paste
			</Button>
		</ButtonGroup>
	);
}
