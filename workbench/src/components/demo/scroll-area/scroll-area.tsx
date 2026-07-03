import * as React from "react";

import { ScrollArea } from "~/components/ui/scroll-area";
import { Separator } from "~/components/ui/separator";

const tags = Array.from({ length: 50 }).map((_, i, a) => `v1.2.0-beta.${a.length - i}`);

// type="always" keeps the scrollbar + thumb mounted (the vendored ScrollArea defaults to Radix
// type="hover", which mounts them only on hover — so those two slots wouldn't derive at rest).
export function ScrollAreaDemo() {
	return (
		<ScrollArea type="always" className="h-72 w-48 rounded-md border">
			<div className="p-4">
				<h4 className="mb-4 text-sm leading-none font-medium">Tags</h4>
				{tags.map((tag) => (
					<React.Fragment key={tag}>
						<div className="text-sm">{tag}</div>
						<Separator className="my-2" />
					</React.Fragment>
				))}
			</div>
		</ScrollArea>
	);
}
