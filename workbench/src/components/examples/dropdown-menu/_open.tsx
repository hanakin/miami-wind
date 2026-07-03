"use client";

import { DropdownMenu as DMP } from "radix-ui";
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
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

// Content classNames copied from the vendored primitive (src/components/ui/dropdown-menu.tsx) so the
// force-mounted raw Content/SubContent carry the seed look for their slot.
const DROPDOWN_CONTENT =
	"z-50 min-w-[12rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md";
const DROPDOWN_SUB_CONTENT =
	"z-50 min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg";

export function DropdownMenuOpen() {
	const [host, setHost] = useState<HTMLDivElement | null>(null);
	const [host2, setHost2] = useState<HTMLDivElement | null>(null);
	return (
		<DropdownMenu open modal={false}>
			<DropdownMenuTrigger asChild>
				<Button variant="outline">Open menu</Button>
			</DropdownMenuTrigger>
			<div ref={setHost} />
			{host && (
				<DMP.Portal container={host}>
					<DMP.Content
						forceMount
						data-slot="dropdown-menu-content"
						className={DROPDOWN_CONTENT}
						onCloseAutoFocus={(e) => e.preventDefault()}
						onEscapeKeyDown={(e) => e.preventDefault()}
						onPointerDownOutside={(e) => e.preventDefault()}
					>
						<DropdownMenuLabel>My Account</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
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
							<DMP.SubTrigger
								data-slot="dropdown-menu-sub-trigger"
								className="flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground"
							>
								Invite users
							</DMP.SubTrigger>
							<div ref={setHost2} />
							{host2 && (
								<DMP.Portal container={host2}>
									<DMP.SubContent
										forceMount
										data-slot="dropdown-menu-sub-content"
										className={DROPDOWN_SUB_CONTENT}
									>
										<DropdownMenuItem>Email</DropdownMenuItem>
										<DropdownMenuItem>Message</DropdownMenuItem>
									</DMP.SubContent>
								</DMP.Portal>
							)}
						</DropdownMenuSub>
					</DMP.Content>
				</DMP.Portal>
			)}
		</DropdownMenu>
	);
}
