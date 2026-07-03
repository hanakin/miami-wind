"use client";

import { useState } from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { Button } from "~/components/ui/button";
import {
	DrawerClose,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "~/components/ui/drawer";

// Content className copied from the vendored primitive (src/components/ui/drawer.tsx) so the
// force-mounted raw Content carries the seed look for its slot.
const DRAWER_CONTENT =
	"group/drawer-content z-50 flex h-auto w-full flex-col rounded-t-lg border bg-background";

export function DrawerOpen() {
	const [host, setHost] = useState<HTMLDivElement | null>(null);
	return (
		<DrawerPrimitive.Root open>
			<DrawerTrigger asChild>
				<Button variant="outline" data-slot="drawer-trigger">
					Open drawer
				</Button>
			</DrawerTrigger>
			<div ref={setHost} />
			{host && (
				<DrawerPrimitive.Portal container={host}>
					<DrawerPrimitive.Overlay
						data-slot="drawer-overlay"
						className="fixed inset-0 z-50 bg-black/50"
					/>
					<DrawerPrimitive.Content data-slot="drawer-content" className={DRAWER_CONTENT}>
						<DrawerPrimitive.Handle data-slot="drawer-handle" />
						<DrawerHeader>
							<DrawerTitle>Drawer title</DrawerTitle>
							<DrawerDescription>A bottom sheet.</DrawerDescription>
						</DrawerHeader>
						<div className="p-4 pt-0 text-sm text-muted-foreground">
							Drawer body content goes here.
						</div>
						<DrawerFooter>
							<Button>Submit</Button>
							<DrawerClose asChild>
								<Button variant="outline">Cancel</Button>
							</DrawerClose>
						</DrawerFooter>
					</DrawerPrimitive.Content>
				</DrawerPrimitive.Portal>
			)}
		</DrawerPrimitive.Root>
	);
}
