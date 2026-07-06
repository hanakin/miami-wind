"use client";

import { Menu as MBP } from "@base-ui/react/menu";
import { useState } from "react";
import {
	Menubar,
	MenubarCheckboxItem,
	MenubarGroup,
	MenubarItem,
	MenubarLabel,
	MenubarMenu,
	MenubarRadioGroup,
	MenubarRadioItem,
	MenubarSeparator,
	MenubarShortcut,
	MenubarSub,
	MenubarSubTrigger,
	MenubarTrigger,
} from "~/components/ui/menubar";

// Popup classNames copied from the vendored primitive (src/components/ui/menubar.tsx) so the
// keep-mounted raw Positioner/Popup carry the seed look for their slot.
const MENUBAR_CONTENT =
	"z-50 min-w-36 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-md bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-none";
const MENUBAR_SUB_CONTENT =
	"z-50 min-w-32 origin-(--transform-origin) rounded-md bg-popover p-1 text-popover-foreground shadow-lg ring-1 ring-foreground/10 outline-none";

export function MenubarOpen() {
	const [host, setHost] = useState<HTMLDivElement | null>(null);
	const [host2, setHost2] = useState<HTMLDivElement | null>(null);
	return (
		<Menubar>
			<MenubarMenu open>
				<MenubarTrigger>File</MenubarTrigger>
				<div ref={setHost} />
				{host && (
					<MBP.Portal container={host} keepMounted>
						<MBP.Positioner className="isolate z-50 outline-none" sideOffset={8}>
							<MBP.Popup data-slot="menubar-content" className={MENUBAR_CONTENT}>
								<MenubarGroup>
									<MenubarLabel>File</MenubarLabel>
									<MenubarSeparator />
									<MenubarItem>
										New Tab
										<MenubarShortcut>⌘T</MenubarShortcut>
									</MenubarItem>
									<MenubarItem>
										New Window
										<MenubarShortcut>⌘N</MenubarShortcut>
									</MenubarItem>
									<MenubarItem variant="destructive">Close Tab</MenubarItem>
								</MenubarGroup>
								<MenubarSeparator />
								<MenubarCheckboxItem checked>Show Toolbar</MenubarCheckboxItem>
								<MenubarSeparator />
								<MenubarRadioGroup value="light">
									<MenubarRadioItem value="light">Light</MenubarRadioItem>
									<MenubarRadioItem value="dark">Dark</MenubarRadioItem>
								</MenubarRadioGroup>
								<MenubarSeparator />
								<MenubarSub open>
									<MenubarSubTrigger>Share</MenubarSubTrigger>
									<div ref={setHost2} />
									{host2 && (
										<MBP.Portal container={host2} keepMounted>
											<MBP.Positioner className="isolate z-50 outline-none" sideOffset={4}>
												<MBP.Popup data-slot="menubar-sub-content" className={MENUBAR_SUB_CONTENT}>
													<MenubarItem>Email Link</MenubarItem>
													<MenubarItem>Messages</MenubarItem>
												</MBP.Popup>
											</MBP.Positioner>
										</MBP.Portal>
									)}
								</MenubarSub>
							</MBP.Popup>
						</MBP.Positioner>
					</MBP.Portal>
				)}
			</MenubarMenu>
			<MenubarMenu>
				<MenubarTrigger>Edit</MenubarTrigger>
			</MenubarMenu>
		</Menubar>
	);
}
