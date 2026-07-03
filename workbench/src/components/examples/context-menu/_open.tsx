"use client";

import { ContextMenu as CMP } from "radix-ui";
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
	ContextMenuTrigger,
} from "~/components/ui/context-menu";

// Content classNames copied from the vendored primitive (src/components/ui/context-menu.tsx) so the
// force-mounted raw Content/SubContent carry the seed look for their slot.
const CONTEXT_MENU_CONTENT =
	"z-50 max-h-(--radix-context-menu-content-available-height) min-w-[8rem] origin-(--radix-context-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md";
const CONTEXT_MENU_SUB_CONTENT =
	"z-50 min-w-[8rem] origin-(--radix-context-menu-content-transform-origin) overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg";

export function ContextMenuOpen() {
	const [host, setHost] = useState<HTMLDivElement | null>(null);
	const [host2, setHost2] = useState<HTMLDivElement | null>(null);
	return (
		<ContextMenu modal={false}>
			<ContextMenuTrigger className="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed text-sm">
				Right click here
			</ContextMenuTrigger>
			<div ref={setHost} />
			{host && (
				<CMP.Portal container={host}>
					<CMP.Content
						forceMount
						data-slot="context-menu-content"
						className={CONTEXT_MENU_CONTENT}
						onCloseAutoFocus={(e) => e.preventDefault()}
						onEscapeKeyDown={(e) => e.preventDefault()}
						onPointerDownOutside={(e) => e.preventDefault()}
					>
						<ContextMenuLabel>My Account</ContextMenuLabel>
						<ContextMenuSeparator />
						<ContextMenuGroup>
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
							<CMP.SubTrigger
								data-slot="context-menu-sub-trigger"
								className="flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground"
							>
								More options
							</CMP.SubTrigger>
							<div ref={setHost2} />
							{host2 && (
								<CMP.Portal container={host2}>
									<CMP.SubContent
										forceMount
										data-slot="context-menu-sub-content"
										className={CONTEXT_MENU_SUB_CONTENT}
									>
										<ContextMenuItem>View source</ContextMenuItem>
										<ContextMenuItem>Inspect element</ContextMenuItem>
									</CMP.SubContent>
								</CMP.Portal>
							)}
						</ContextMenuSub>
					</CMP.Content>
				</CMP.Portal>
			)}
		</ContextMenu>
	);
}
