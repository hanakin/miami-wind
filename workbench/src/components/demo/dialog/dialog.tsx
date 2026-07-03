"use client";

import { Button } from "~/components/ui/button";
import { Dialog, DialogTrigger } from "~/components/ui/dialog";

export function DialogDemo() {
	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="outline">Open Dialog</Button>
			</DialogTrigger>
		</Dialog>
	);
}
