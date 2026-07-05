"use client";

import { Button } from "~/components/ui/button";
import { Popover, PopoverTrigger } from "~/components/ui/popover";

export function PopoverDemo() {
	return (
		<Popover>
			<PopoverTrigger render={<Button variant="outline">Open popover</Button>} />
		</Popover>
	);
}
