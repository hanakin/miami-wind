"use client";

import { Button } from "~/components/ui/button";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "~/components/ui/drawer";

export function DrawerOpen() {
	return (
		<Drawer open modal={false}>
			<DrawerTrigger
				render={
					<Button variant="outline" data-slot="drawer-trigger">
						Open drawer
					</Button>
				}
			/>
			<DrawerContent>
				<DrawerHeader>
					<DrawerTitle>Drawer title</DrawerTitle>
					<DrawerDescription>A bottom sheet.</DrawerDescription>
				</DrawerHeader>
				<div className="p-4 pt-0 text-sm text-muted-foreground">Drawer body content goes here.</div>
				<DrawerFooter>
					<Button>Submit</Button>
					<DrawerClose render={<Button variant="outline">Cancel</Button>} />
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}
