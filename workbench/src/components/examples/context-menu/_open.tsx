"use client";

import { ContextMenu as CMP } from "@base-ui/react/context-menu";
import { useState } from "react";
import {
	ContextMenu,
	ContextMenuCheckboxItem,
	ContextMenuGroup,
	ContextMenuItem,
	ContextMenuLabel,
	ContextMenuRadioGroup,
	ContextMenuRadioItem,
	ContextMenuSeparator,
	ContextMenuShortcut,
	ContextMenuSub,
	ContextMenuSubTrigger,
	ContextMenuTrigger,
} from "~/components/ui/context-menu";

// Popup classNames copied from the vendored primitive (src/components/ui/context-menu.tsx) so the
// keep-mounted raw Positioner/Popup carry the seed look for their slot.
const CONTEXT_MENU_CONTENT =
	"z-50 max-h-(--available-height) min-w-36 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-md bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-none";
const CONTEXT_MENU_SUB_CONTENT =
	"z-50 min-w-32 origin-(--transform-origin) rounded-md bg-popover p-1 text-popover-foreground shadow-lg ring-1 ring-foreground/10 outline-none";

export function ContextMenuOpen() {
	const [host, setHost] = useState<HTMLDivElement | null>(null);
	const [host2, setHost2] = useState<HTMLDivElement | null>(null);
	return (
		<ContextMenu>
			<ContextMenuTrigger className="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed text-sm">
				Right click here
			</ContextMenuTrigger>
			<div ref={setHost} />
			{host && (
				<CMP.Portal container={host} keepMounted>
					<CMP.Positioner className="isolate z-50 outline-none">
						<CMP.Popup data-slot="context-menu-content" className={CONTEXT_MENU_CONTENT}>
							<ContextMenuGroup>
								<ContextMenuLabel>My Account</ContextMenuLabel>
								<ContextMenuSeparator />
								<ContextMenuItem>
									Profile
									<ContextMenuShortcut>⇧⌘P</ContextMenuShortcut>
								</ContextMenuItem>
								<ContextMenuItem>
									Settings
									<ContextMenuShortcut>⌘S</ContextMenuShortcut>
								</ContextMenuItem>
								<ContextMenuItem variant="destructive">Log out</ContextMenuItem>
							</ContextMenuGroup>
							<ContextMenuSeparator />
							<ContextMenuCheckboxItem checked>Show toolbar</ContextMenuCheckboxItem>
							<ContextMenuCheckboxItem>Show status bar</ContextMenuCheckboxItem>
							<ContextMenuSeparator />
							<ContextMenuRadioGroup value="light">
								<ContextMenuLabel>Theme</ContextMenuLabel>
								<ContextMenuRadioItem value="light">Light</ContextMenuRadioItem>
								<ContextMenuRadioItem value="dark">Dark</ContextMenuRadioItem>
							</ContextMenuRadioGroup>
							<ContextMenuSeparator />
							<ContextMenuSub open>
								<ContextMenuSubTrigger>More options</ContextMenuSubTrigger>
								<div ref={setHost2} />
								{host2 && (
									<CMP.Portal container={host2} keepMounted>
										<CMP.Positioner className="isolate z-50 outline-none">
											<CMP.Popup
												data-slot="context-menu-sub-content"
												className={CONTEXT_MENU_SUB_CONTENT}
											>
												<ContextMenuItem>View source</ContextMenuItem>
												<ContextMenuItem>Inspect element</ContextMenuItem>
											</CMP.Popup>
										</CMP.Positioner>
									</CMP.Portal>
								)}
							</ContextMenuSub>
						</CMP.Popup>
					</CMP.Positioner>
				</CMP.Portal>
			)}
		</ContextMenu>
	);
}
