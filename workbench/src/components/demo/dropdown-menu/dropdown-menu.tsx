"use client";

import { Button } from "~/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";

export function DropdownMenuDemo() {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline">Open</Button>
			</DropdownMenuTrigger>
		</DropdownMenu>
	);
}
