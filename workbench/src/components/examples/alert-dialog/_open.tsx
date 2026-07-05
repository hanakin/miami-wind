"use client";

import { AlertDialog as ADP } from "@base-ui/react/alert-dialog";
import { useState } from "react";
import {
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";

// classNames copied from the vendored primitive (src/components/ui/alert-dialog.tsx) so the
// keep-mounted raw Backdrop/Popup carry the seed look for their slot.
const ALERT_DIALOG_OVERLAY =
	"absolute inset-0 isolate z-50 bg-black/10 supports-backdrop-filter:backdrop-blur-xs";
const ALERT_DIALOG_CONTENT =
	"group/alert-dialog-content absolute top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-6 rounded-xl bg-popover p-6 text-popover-foreground ring-1 ring-foreground/10 outline-none data-[size=default]:sm:max-w-lg";

export function AlertDialogOpen() {
	const [host, setHost] = useState<HTMLDivElement | null>(null);
	return (
		<ADP.Root open>
			<AlertDialogTrigger render={<Button variant="outline">Show dialog</Button>} />
			<div ref={setHost} className="relative min-h-[200px] w-full" />
			{host && (
				<ADP.Portal container={host} keepMounted>
					<ADP.Backdrop data-slot="alert-dialog-overlay" className={ALERT_DIALOG_OVERLAY} />
					<ADP.Popup
						data-slot="alert-dialog-content"
						data-size="default"
						className={ALERT_DIALOG_CONTENT}
					>
						<AlertDialogHeader>
							<AlertDialogTitle>Delete file?</AlertDialogTitle>
							<AlertDialogDescription>This permanently removes the file.</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction>Delete</AlertDialogAction>
						</AlertDialogFooter>
					</ADP.Popup>
				</ADP.Portal>
			)}
		</ADP.Root>
	);
}
