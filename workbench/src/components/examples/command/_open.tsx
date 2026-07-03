"use client";

import { Icon } from "@registry-ui/icon";
import { Dialog as DialogP } from "radix-ui";
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
			<div ref={setHost} />
			{host && (
				<DialogP.Portal container={host}>
					<DialogP.Content
						forceMount
						data-slot="dialog-content"
						className="overflow-hidden p-0 sm:max-w-lg"
						onCloseAutoFocus={(e) => e.preventDefault()}
						onEscapeKeyDown={(e) => e.preventDefault()}
						onInteractOutside={(e) => e.preventDefault()}
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
					</DialogP.Content>
				</DialogP.Portal>
			)}
		</DialogP.Root>
	);
}
