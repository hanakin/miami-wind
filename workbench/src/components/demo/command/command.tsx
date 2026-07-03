"use client";

import { Icon } from "@registry-ui/icon";
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

export function CommandDemo() {
	return (
		<Command className="max-w-sm rounded-lg border">
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
					<CommandItem disabled>
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
	);
}
