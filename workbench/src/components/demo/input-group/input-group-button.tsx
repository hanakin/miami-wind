"use client";

import { Icon } from "@registry-ui/icon";
import * as React from "react";

import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "~/components/ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";

export function InputGroupButtonDemo() {
	const [isCopied, setIsCopied] = React.useState(false);
	const [isFavorite, setIsFavorite] = React.useState(false);

	return (
		<div className="grid w-full max-w-sm gap-6">
			<InputGroup>
				<InputGroupInput placeholder="https://x.com/shadcn" readOnly />
				<InputGroupAddon align="inline-end">
					<InputGroupButton
						aria-label="Copy"
						title="Copy"
						size="icon-xs"
						onClick={() => {
							setIsCopied(true);
							setTimeout(() => setIsCopied(false), 2000);
						}}
					>
						{isCopied ? <Icon icon="mdi:check" /> : <Icon icon="mdi:content-copy" />}
					</InputGroupButton>
				</InputGroupAddon>
			</InputGroup>
			<InputGroup className="[--radius:9999px]">
				<Popover>
					<PopoverTrigger asChild>
						<InputGroupAddon>
							<InputGroupButton variant="secondary" size="icon-xs">
								<Icon icon="mdi:information-outline" />
							</InputGroupButton>
						</InputGroupAddon>
					</PopoverTrigger>
					<PopoverContent align="start" className="flex flex-col gap-1 rounded-xl text-sm">
						<p className="font-medium">Your connection is not secure.</p>
						<p>You should not enter any sensitive information on this site.</p>
					</PopoverContent>
				</Popover>
				<InputGroupAddon className="pl-1.5 text-muted-foreground">https://</InputGroupAddon>
				<InputGroupInput id="input-secure-19" />
				<InputGroupAddon align="inline-end">
					<InputGroupButton onClick={() => setIsFavorite(!isFavorite)} size="icon-sm">
						<Icon icon="mdi:star" />
					</InputGroupButton>
				</InputGroupAddon>
			</InputGroup>
			<InputGroup>
				<InputGroupInput placeholder="Type to search..." />
				<InputGroupAddon align="inline-end">
					<InputGroupButton variant="secondary" size="xs">
						Search
					</InputGroupButton>
				</InputGroupAddon>
			</InputGroup>
		</div>
	);
}
