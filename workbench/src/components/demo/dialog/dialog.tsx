"use client";

import { Button } from "~/components/ui/button";
import { Dialog, DialogTrigger } from "~/components/ui/dialog";

export function DialogDemo() {
	return (
		<Dialog>
			<DialogTrigger render={<Button variant="outline">Open Dialog</Button>} />
		</Dialog>
	);
}
