"use client";

import { Menubar as MBP } from "radix-ui";
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
	MenubarTrigger,
} from "~/components/ui/menubar";

// Content classNames copied from the vendored primitive (src/components/ui/menubar.tsx) so the
// force-mounted raw Content/SubContent carry the seed look for their slot.
const MENUBAR_CONTENT =
	"z-50 min-w-[12rem] origin-(--radix-menubar-content-transform-origin) overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md";
const MENUBAR_SUB_CONTENT =
	"z-50 min-w-[8rem] origin-(--radix-menubar-content-transform-origin) overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg";

export function MenubarOpen() {
	const [host, setHost] = useState<HTMLDivElement | null>(null);
	const [host2, setHost2] = useState<HTMLDivElement | null>(null);
	return (
		<Menubar value="file">
			<MenubarMenu value="file">
				<MenubarTrigger>File</MenubarTrigger>
				<div ref={setHost} />
				{host && (
					<MBP.Portal container={host}>
						<MBP.Content
							forceMount
							data-slot="menubar-content"
							className={MENUBAR_CONTENT}
							onCloseAutoFocus={(e) => e.preventDefault()}
							onEscapeKeyDown={(e) => e.preventDefault()}
							onPointerDownOutside={(e) => e.preventDefault()}
						>
							<MenubarLabel>File</MenubarLabel>
							<MenubarSeparator />
							<MenubarGroup>
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
								<MBP.SubTrigger
									data-slot="menubar-sub-trigger"
									className="flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-none select-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground"
								>
									Share
								</MBP.SubTrigger>
								<div ref={setHost2} />
								{host2 && (
									<MBP.Portal container={host2}>
										<MBP.SubContent
											forceMount
											data-slot="menubar-sub-content"
											className={MENUBAR_SUB_CONTENT}
										>
											<MenubarItem>Email Link</MenubarItem>
											<MenubarItem>Messages</MenubarItem>
										</MBP.SubContent>
									</MBP.Portal>
								)}
							</MenubarSub>
						</MBP.Content>
					</MBP.Portal>
				)}
			</MenubarMenu>
			<MenubarMenu value="edit">
				<MenubarTrigger>Edit</MenubarTrigger>
			</MenubarMenu>
		</Menubar>
	);
}
