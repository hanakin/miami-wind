import { Icon } from "@registry-ui/icon";
import { Button } from "~/components/ui/button";
import { ButtonGroup } from "~/components/ui/button-group";

export function ButtonGroupOrientation() {
	return (
		<ButtonGroup orientation="vertical" aria-label="Media controls" className="h-fit">
			<Button variant="outline" size="icon">
				<Icon icon="mdi:plus" />
			</Button>
			<Button variant="outline" size="icon">
				<Icon icon="mdi:minus" />
			</Button>
		</ButtonGroup>
	);
}
