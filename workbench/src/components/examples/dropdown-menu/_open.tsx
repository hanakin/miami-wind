"use client";

import { Menu as DMP } from "@base-ui/react/menu";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuSub,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

// Popup classNames copied from the vendored primitive (src/components/ui/dropdown-menu.tsx) so the
// keep-mounted raw Positioner/Popup carry the seed look for their slot.
const DROPDOWN_CONTENT =
	"z-50 min-w-48 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-md bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-none";
const DROPDOWN_SUB_CONTENT =
	"z-50 w-auto min-w-24 origin-(--transform-origin) rounded-md bg-popover p-1 text-popover-foreground shadow-lg ring-1 ring-foreground/10 outline-none";

export function DropdownMenuOpen() {
	const [host, setHost] = useState<HTMLDivElement | null>(null);
	const [host2, setHost2] = useState<HTMLDivElement | null>(null);
	return (
		<DropdownMenu open modal={false}>
			<DropdownMenuTrigger render={<Button variant="outline">Open menu</Button>} />
			<div ref={setHost} />
			{host && (
				<DMP.Portal container={host} keepMounted>
					<DMP.Positioner className="isolate z-50 outline-none" sideOffset={4}>
						<DMP.Popup data-slot="dropdown-menu-content" className={DROPDOWN_CONTENT}>
							<DropdownMenuGroup>
								<DropdownMenuLabel>My Account</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem>
									Profile
									<DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
								</DropdownMenuItem>
								<DropdownMenuItem>Settings</DropdownMenuItem>
								<DropdownMenuItem variant="destructive">Log out</DropdownMenuItem>
							</DropdownMenuGroup>
							<DropdownMenuSeparator />
							<DropdownMenuCheckboxItem checked>Show status bar</DropdownMenuCheckboxItem>
							<DropdownMenuSeparator />
							<DropdownMenuRadioGroup value="light">
								<DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
								<DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
							</DropdownMenuRadioGroup>
							<DropdownMenuSeparator />
							<DropdownMenuSub open>
								<DropdownMenuSubTrigger>Invite users</DropdownMenuSubTrigger>
								<div ref={setHost2} />
								{host2 && (
									<DMP.Portal container={host2} keepMounted>
										<DMP.Positioner className="isolate z-50 outline-none" sideOffset={4}>
											<DMP.Popup
												data-slot="dropdown-menu-sub-content"
												className={DROPDOWN_SUB_CONTENT}
											>
												<DropdownMenuItem>Email</DropdownMenuItem>
												<DropdownMenuItem>Message</DropdownMenuItem>
											</DMP.Popup>
										</DMP.Positioner>
									</DMP.Portal>
								)}
							</DropdownMenuSub>
						</DMP.Popup>
					</DMP.Positioner>
				</DMP.Portal>
			)}
		</DropdownMenu>
	);
}
