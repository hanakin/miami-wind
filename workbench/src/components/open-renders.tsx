import { Combobox as ComboboxPrimitive } from "@base-ui/react";
import {
	AlertDialog as ADP,
	ContextMenu as CMP,
	Dialog as DialogP,
	DropdownMenu as DMP,
	HoverCard as HCP,
	Menubar as MBP,
	Popover as PopoverP,
	Select as SelectP,
	Dialog as SheetP,
	Tooltip as TooltipP,
} from "radix-ui";
import { type ReactNode, useState } from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import {
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { Combobox, ComboboxItem, ComboboxList } from "~/components/ui/combobox";
import {
	Command,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "~/components/ui/command";
import {
	ContextMenuItem,
	ContextMenuLabel,
	ContextMenuSeparator,
} from "~/components/ui/context-menu";
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "~/components/ui/drawer";
import {
	DropdownMenu,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { MenubarItem, MenubarLabel, MenubarSeparator } from "~/components/ui/menubar";
import { SelectItem, SelectLabel, SelectSeparator } from "~/components/ui/select";
import { SheetDescription, SheetHeader, SheetTitle } from "~/components/ui/sheet";

// Editor-only "exploded" renders. Portal-backed primitives (dropdown, popover, dialog…) normally
// hide their surfaces in document.body, out of reach of the inspector and the [data-preview]-scoped
// live-css. Here we keep the real radix Root (its sub-parts demand that context) but redirect the
// portal into an in-preview container, so every surface renders inline, tagged with its real
// data-slot, and becomes selectable + live-styleable. Vendored ui/ is never touched.

// The content classNames below are copied from each vendored primitive (the seed look for its slot).
// ponytail: duplicated here on purpose — the chosen "editor-only renders" path trades this small
// copy for leaving ui/ vanilla. The editable truth still comes from the slot manifest on Save.

const DROPDOWN_CONTENT =
	"z-50 min-w-[12rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md";
const SELECT_CONTENT =
	"relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md";
const POPOVER_CONTENT =
	"z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-hidden";
const DIALOG_OVERLAY = "fixed inset-0 z-50 bg-black/50";
const DIALOG_CONTENT =
	"fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border bg-background p-6 shadow-lg duration-200 outline-none sm:max-w-lg";
const ALERT_DIALOG_OVERLAY = "fixed inset-0 z-50 bg-black/50";
const ALERT_DIALOG_CONTENT =
	"group/alert-dialog-content fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border bg-background p-6 shadow-lg duration-200 data-[size=default]:sm:max-w-lg";
const SHEET_OVERLAY = "fixed inset-0 z-50 bg-black/50";
const SHEET_CONTENT =
	"fixed z-50 flex flex-col gap-4 bg-background shadow-lg transition ease-in-out inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm";
const TOOLTIP_CONTENT =
	"z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md bg-foreground px-3 py-1.5 text-xs text-balance text-background";
const HOVER_CARD_CONTENT =
	"z-50 w-64 origin-(--radix-hover-card-content-transform-origin) rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-hidden";
const CONTEXT_MENU_CONTENT =
	"z-50 max-h-(--radix-context-menu-content-available-height) min-w-[8rem] origin-(--radix-context-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md";
const MENUBAR_CONTENT =
	"z-50 min-w-[12rem] origin-(--radix-menubar-content-transform-origin) overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md";

function DropdownMenuOpen() {
	const [host, setHost] = useState<HTMLDivElement | null>(null);
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
						<DropdownMenuItem>Profile</DropdownMenuItem>
						<DropdownMenuItem>Settings</DropdownMenuItem>
						<DropdownMenuItem variant="destructive">Log out</DropdownMenuItem>
					</DMP.Content>
				</DMP.Portal>
			)}
		</DropdownMenu>
	);
}

function SelectOpen() {
	const [host, setHost] = useState<HTMLDivElement | null>(null);
	return (
		<SelectP.Root open value="a">
			<SelectP.Trigger
				data-slot="select-trigger"
				className="flex w-44 items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs outline-none"
			>
				<SelectP.Value placeholder="Pick one" />
			</SelectP.Trigger>
			<div ref={setHost} />
			{host && (
				<SelectP.Portal container={host}>
					<SelectP.Content
						forceMount
						position="item-aligned"
						data-slot="select-content"
						className={SELECT_CONTENT}
						onCloseAutoFocus={(e) => e.preventDefault()}
						onEscapeKeyDown={(e) => e.preventDefault()}
						onPointerDownOutside={(e) => e.preventDefault()}
					>
						<SelectP.Viewport className="p-1">
							<SelectP.Group>
								<SelectLabel>Fruits</SelectLabel>
								<SelectItem value="a">Apple</SelectItem>
								<SelectItem value="b">Banana</SelectItem>
								<SelectSeparator />
								<SelectItem value="c">Cherry</SelectItem>
							</SelectP.Group>
						</SelectP.Viewport>
					</SelectP.Content>
				</SelectP.Portal>
			)}
		</SelectP.Root>
	);
}

function PopoverOpen() {
	const [host, setHost] = useState<HTMLDivElement | null>(null);
	return (
		<PopoverP.Root open>
			<PopoverP.Trigger asChild>
				<Button variant="outline" data-slot="popover-trigger">
					Open popover
				</Button>
			</PopoverP.Trigger>
			<div ref={setHost} />
			{host && (
				<PopoverP.Portal container={host}>
					<PopoverP.Content
						forceMount
						data-slot="popover-content"
						className={POPOVER_CONTENT}
						onCloseAutoFocus={(e) => e.preventDefault()}
						onEscapeKeyDown={(e) => e.preventDefault()}
						onPointerDownOutside={(e) => e.preventDefault()}
					>
						Popover content.
					</PopoverP.Content>
				</PopoverP.Portal>
			)}
		</PopoverP.Root>
	);
}

function DialogOpen() {
	const [host, setHost] = useState<HTMLDivElement | null>(null);
	return (
		<DialogP.Root open modal={false}>
			<DialogP.Trigger asChild>
				<Button variant="outline">Open dialog</Button>
			</DialogP.Trigger>
			<div ref={setHost} />
			{host && (
				<DialogP.Portal container={host}>
					<DialogP.Overlay data-slot="dialog-overlay" className={DIALOG_OVERLAY} />
					<DialogP.Content
						forceMount
						data-slot="dialog-content"
						className={DIALOG_CONTENT}
						onCloseAutoFocus={(e) => e.preventDefault()}
						onEscapeKeyDown={(e) => e.preventDefault()}
						onInteractOutside={(e) => e.preventDefault()}
					>
						<DialogHeader>
							<DialogTitle>Are you sure?</DialogTitle>
							<DialogDescription>This action cannot be undone.</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Button variant="outline">Cancel</Button>
							<Button>Continue</Button>
						</DialogFooter>
					</DialogP.Content>
				</DialogP.Portal>
			)}
		</DialogP.Root>
	);
}

function AlertDialogOpen() {
	const [host, setHost] = useState<HTMLDivElement | null>(null);
	return (
		<ADP.Root open>
			<ADP.Trigger asChild>
				<Button variant="outline">Show dialog</Button>
			</ADP.Trigger>
			<div ref={setHost} />
			{host && (
				<ADP.Portal container={host}>
					<ADP.Overlay data-slot="alert-dialog-overlay" className={ALERT_DIALOG_OVERLAY} />
					<ADP.Content
						forceMount
						data-slot="alert-dialog-content"
						data-size="default"
						className={ALERT_DIALOG_CONTENT}
						onEscapeKeyDown={(e) => e.preventDefault()}
					>
						<AlertDialogHeader>
							<AlertDialogTitle>Delete file?</AlertDialogTitle>
							<AlertDialogDescription>This permanently removes the file.</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction>Delete</AlertDialogAction>
						</AlertDialogFooter>
					</ADP.Content>
				</ADP.Portal>
			)}
		</ADP.Root>
	);
}

function SheetOpen() {
	const [host, setHost] = useState<HTMLDivElement | null>(null);
	return (
		<SheetP.Root open modal={false}>
			<SheetP.Trigger asChild>
				<Button variant="outline">Open sheet</Button>
			</SheetP.Trigger>
			<div ref={setHost} />
			{host && (
				<SheetP.Portal container={host}>
					<SheetP.Overlay data-slot="sheet-overlay" className={SHEET_OVERLAY} />
					<SheetP.Content
						forceMount
						data-slot="sheet-content"
						className={SHEET_CONTENT}
						onCloseAutoFocus={(e) => e.preventDefault()}
						onEscapeKeyDown={(e) => e.preventDefault()}
						onInteractOutside={(e) => e.preventDefault()}
					>
						<SheetHeader>
							<SheetTitle>Edit profile</SheetTitle>
							<SheetDescription>Make changes to your profile here.</SheetDescription>
						</SheetHeader>
					</SheetP.Content>
				</SheetP.Portal>
			)}
		</SheetP.Root>
	);
}

function TooltipOpen() {
	const [host, setHost] = useState<HTMLDivElement | null>(null);
	return (
		<TooltipP.Provider>
			<TooltipP.Root open>
				<TooltipP.Trigger asChild>
					<Button variant="outline" data-slot="tooltip-trigger">
						Hover me
					</Button>
				</TooltipP.Trigger>
				<div ref={setHost} />
				{host && (
					<TooltipP.Portal container={host}>
						<TooltipP.Content forceMount data-slot="tooltip-content" className={TOOLTIP_CONTENT}>
							Tooltip content
						</TooltipP.Content>
					</TooltipP.Portal>
				)}
			</TooltipP.Root>
		</TooltipP.Provider>
	);
}

function HoverCardOpen() {
	const [host, setHost] = useState<HTMLDivElement | null>(null);
	return (
		<HCP.Root open>
			<HCP.Trigger asChild>
				<Button variant="link" data-slot="hover-card-trigger">
					@miami-wind
				</Button>
			</HCP.Trigger>
			<div ref={setHost} />
			{host && (
				<HCP.Portal container={host}>
					<HCP.Content forceMount data-slot="hover-card-content" className={HOVER_CARD_CONTENT}>
						A dark-only shadcn registry.
					</HCP.Content>
				</HCP.Portal>
			)}
		</HCP.Root>
	);
}

function ContextMenuOpen() {
	const [host, setHost] = useState<HTMLDivElement | null>(null);
	return (
		<CMP.Root modal={false}>
			<CMP.Trigger
				data-slot="context-menu-trigger"
				className="grid h-16 w-48 place-items-center rounded-md border border-dashed border-border text-sm text-subtext0"
			>
				Right-click here
			</CMP.Trigger>
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
						<ContextMenuLabel>Actions</ContextMenuLabel>
						<ContextMenuSeparator />
						<ContextMenuItem>Back</ContextMenuItem>
						<ContextMenuItem>Reload</ContextMenuItem>
						<ContextMenuItem variant="destructive">Delete</ContextMenuItem>
					</CMP.Content>
				</CMP.Portal>
			)}
		</CMP.Root>
	);
}

function MenubarOpen() {
	const [host, setHost] = useState<HTMLDivElement | null>(null);
	return (
		<MBP.Root
			value="file"
			data-slot="menubar"
			className="flex h-9 items-center gap-1 rounded-md border bg-background p-1 shadow-xs"
		>
			<MBP.Menu value="file">
				<MBP.Trigger
					data-slot="menubar-trigger"
					className="flex items-center rounded-sm px-2 py-1 text-sm font-medium outline-hidden select-none data-[state=open]:bg-accent data-[state=open]:text-accent-foreground"
				>
					File
				</MBP.Trigger>
				<div ref={setHost} />
				{host && (
					<MBP.Portal container={host}>
						<MBP.Content
							forceMount
							data-slot="menubar-content"
							className={MENUBAR_CONTENT}
							onCloseAutoFocus={(e) => e.preventDefault()}
							onEscapeKeyDown={(e) => e.preventDefault()}
							onPointerDownOutside={(e) => e.preventDefault()}
						>
							<MenubarLabel>File</MenubarLabel>
							<MenubarSeparator />
							<MenubarItem>New</MenubarItem>
							<MenubarItem>Open</MenubarItem>
						</MBP.Content>
					</MBP.Portal>
				)}
			</MBP.Menu>
		</MBP.Root>
	);
}

// command (cmdk) renders inline already — no portal to redirect. Its sub-parts carry data-slots, so
// rendering it inline exposes them directly.
function CommandOpen() {
	return (
		<Command className="w-64 border border-border">
			<CommandInput placeholder="Search…" />
			<CommandList>
				<CommandGroup heading="Suggestions">
					<CommandItem>Calendar</CommandItem>
					<CommandItem>Search</CommandItem>
				</CommandGroup>
				<CommandSeparator />
				<CommandGroup heading="Settings">
					<CommandItem>Profile</CommandItem>
				</CommandGroup>
			</CommandList>
		</Command>
	);
}

// combobox (@base-ui/react). Like radix, its popup portals to body — but base-ui's Portal accepts a
// `container` (via floating-ui's FloatingPortal). Force it open, redirect the portal into host, and
// keepMounted so the popup survives even though nothing is focused. The <style> below neutralizes
// base-ui's positioner so the popup stacks inline instead of floating via JS-measured transforms.
function ComboboxOpen() {
	const [host, setHost] = useState<HTMLDivElement | null>(null);
	return (
		<div ref={setHost} className="w-56">
			{host && (
				<Combobox items={["Apple", "Banana", "Cherry"]} defaultOpen>
					<ComboboxPrimitive.Input
						data-slot="combobox-input"
						className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
						placeholder="Pick a fruit…"
					/>
					<ComboboxPrimitive.Portal container={host} keepMounted>
						<ComboboxPrimitive.Positioner className="isolate z-50">
							<ComboboxPrimitive.Popup
								data-slot="combobox-content"
								className="group/combobox-content relative max-h-96 overflow-hidden rounded-md bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10"
							>
								<ComboboxList>
									<ComboboxItem value="Apple">Apple</ComboboxItem>
									<ComboboxItem value="Banana">Banana</ComboboxItem>
									<ComboboxItem value="Cherry">Cherry</ComboboxItem>
								</ComboboxList>
							</ComboboxPrimitive.Popup>
						</ComboboxPrimitive.Positioner>
					</ComboboxPrimitive.Portal>
				</Combobox>
			)}
		</div>
	);
}

// drawer is vaul (not radix); its Portal still forwards a `container`, so the same pattern holds.
const DRAWER_CONTENT =
	"group/drawer-content z-50 flex h-auto w-full flex-col rounded-t-lg border bg-background";

function DrawerOpen() {
	const [host, setHost] = useState<HTMLDivElement | null>(null);
	return (
		<DrawerPrimitive.Root open>
			<DrawerPrimitive.Trigger asChild>
				<Button variant="outline" data-slot="drawer-trigger">
					Open drawer
				</Button>
			</DrawerPrimitive.Trigger>
			<div ref={setHost} />
			{host && (
				<DrawerPrimitive.Portal container={host}>
					<DrawerPrimitive.Overlay
						data-slot="drawer-overlay"
						className="fixed inset-0 z-50 bg-black/50"
					/>
					<DrawerPrimitive.Content data-slot="drawer-content" className={DRAWER_CONTENT}>
						<DrawerHeader>
							<DrawerTitle>Drawer title</DrawerTitle>
							<DrawerDescription>A bottom sheet.</DrawerDescription>
						</DrawerHeader>
						<DrawerFooter>
							<Button>Submit</Button>
						</DrawerFooter>
					</DrawerPrimitive.Content>
				</DrawerPrimitive.Portal>
			)}
		</DrawerPrimitive.Root>
	);
}

/** Components whose hidden surfaces get an exploded, inline render in the editor. */
export const openRenders: Record<string, () => ReactNode> = {
	"dropdown-menu": () => <DropdownMenuOpen />,
	select: () => <SelectOpen />,
	popover: () => <PopoverOpen />,
	dialog: () => <DialogOpen />,
	"alert-dialog": () => <AlertDialogOpen />,
	sheet: () => <SheetOpen />,
	tooltip: () => <TooltipOpen />,
	"hover-card": () => <HoverCardOpen />,
	"context-menu": () => <ContextMenuOpen />,
	menubar: () => <MenubarOpen />,
	command: () => <CommandOpen />,
	combobox: () => <ComboboxOpen />,
	drawer: () => <DrawerOpen />,
};

export function hasOpenRender(name: string): boolean {
	return name in openRenders;
}

/**
 * Renders a component's surfaces inline for editing. Lives inside [data-preview], so the redirected
 * portal content is in scope for live-css. The <style> neutralizes the libraries' fixed/absolute
 * positioning (radix popper, base-ui positioner) so surfaces stack statically instead of floating
 * over the trigger.
 */
export function OpenRender({ name }: { name: string }) {
	const render = openRenders[name];
	if (!render) return null;
	return (
		<div className="mb-6 flex flex-col gap-3 border-b border-border pb-6">
			<span className="text-xs font-medium uppercase tracking-wide text-subtext0">Surfaces</span>
			<style>
				{
					"[data-exploded] [data-radix-popper-content-wrapper]{position:static!important;transform:none!important;inset:auto!important;min-width:0!important;}[data-exploded] [data-slot=dialog-overlay],[data-exploded] [data-slot=alert-dialog-overlay],[data-exploded] [data-slot=sheet-overlay],[data-exploded] [data-slot=drawer-overlay]{display:none!important;}[data-exploded] [data-slot=dialog-content],[data-exploded] [data-slot=alert-dialog-content],[data-exploded] [data-slot=sheet-content],[data-exploded] [data-slot=drawer-content]{position:static!important;transform:none!important;inset:auto!important;}[data-exploded] [data-slot=combobox-content]{position:static!important;transform:none!important;}[data-exploded] [data-side]{position:static!important;transform:none!important;inset:auto!important;}"
				}
			</style>
			<div data-exploded className="flex flex-col items-start gap-3">
				{render()}
			</div>
		</div>
	);
}
