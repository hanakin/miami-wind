"use client";

import { Button } from "~/components/ui/button";
import { Drawer, DrawerTrigger } from "~/components/ui/drawer";

export function DrawerDemo() {
	return (
		<Drawer>
			<DrawerTrigger asChild>
				<Button variant="outline">Open Drawer</Button>
			</DrawerTrigger>
		</Drawer>
	);
}
