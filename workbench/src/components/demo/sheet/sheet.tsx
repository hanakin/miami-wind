"use client";

import { Button } from "~/components/ui/button";
import { Sheet, SheetTrigger } from "~/components/ui/sheet";

export function SheetDemo() {
	return (
		<Sheet>
			<SheetTrigger render={<Button variant="outline">Open</Button>} />
		</Sheet>
	);
}
