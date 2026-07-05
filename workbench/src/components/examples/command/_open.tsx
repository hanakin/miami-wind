"use client";

import { Dialog as DialogP } from "@base-ui/react/dialog";
import { Icon } from "@registry-ui/icon";
import { useState } from "react";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
	CommandShortcut,
} from "~/components/ui/command";

export function CommandDialogOpen() {
	const [host, setHost] = useState<HTMLDivElement | null>(null);
	return (
		<DialogP.Root open modal={false}>
			<div ref={setHost} className="relative min-h-[420px] w-full" />
			{host && (
				<DialogP.Portal container={host} keepMounted>
					<DialogP.Popup
						data-slot="dialog-content"
						className="absolute top-4 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 overflow-hidden rounded-xl bg-popover text-popover-foreground ring-1 ring-foreground/10 outline-none"
					>
						<Command className="**:data-[slot=command-input-wrapper]:h-12 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]]:px-2 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
							<CommandInput placeholder="Type a command or search..." />
							<CommandList>
								<CommandEmpty>No results found.</CommandEmpty>
								<CommandGroup heading="Suggestions">
									<CommandItem>
										<Icon icon="mdi:calendar" />
										<span>Calendar</span>
									</CommandItem>
									<CommandItem>
										<Icon icon="mdi:emoticon-outline" />
										<span>Search Emoji</span>
									</CommandItem>
									<CommandItem>
										<Icon icon="mdi:calculator" />
										<span>Calculator</span>
									</CommandItem>
								</CommandGroup>
								<CommandSeparator />
								<CommandGroup heading="Settings">
									<CommandItem>
										<Icon icon="mdi:account" />
										<span>Profile</span>
										<CommandShortcut>⌘P</CommandShortcut>
									</CommandItem>
									<CommandItem>
										<Icon icon="mdi:credit-card" />
										<span>Billing</span>
										<CommandShortcut>⌘B</CommandShortcut>
									</CommandItem>
									<CommandItem>
										<Icon icon="mdi:cog" />
										<span>Settings</span>
										<CommandShortcut>⌘S</CommandShortcut>
									</CommandItem>
								</CommandGroup>
							</CommandList>
						</Command>
					</DialogP.Popup>
				</DialogP.Portal>
			)}
		</DialogP.Root>
	);
}
