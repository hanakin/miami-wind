"use client";

import { Button } from "~/components/ui/button";
import { Sheet, SheetTrigger } from "~/components/ui/sheet";

export function SheetDemo() {
	return (
		<Sheet>
			<SheetTrigger asChild>
				<Button variant="outline">Open</Button>
			</SheetTrigger>
		</Sheet>
	);
}
