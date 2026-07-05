"use client";

import { Button } from "~/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";

export function DropdownMenuDemo() {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger render={<Button variant="outline">Open</Button>} />
		</DropdownMenu>
	);
}
