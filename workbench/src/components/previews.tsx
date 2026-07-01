import { Icon } from "@registry-ui/icon";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { Bar, BarChart } from "recharts";
import { toast } from "sonner";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "~/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { AlertDialog, AlertDialogTrigger } from "~/components/ui/alert-dialog";
import { AspectRatio } from "~/components/ui/aspect-ratio";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Button } from "~/components/ui/button";
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from "~/components/ui/button-group";
import { Calendar } from "~/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "~/components/ui/carousel";
import { ChartContainer } from "~/components/ui/chart";
import { Checkbox } from "~/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";
import {
	Combobox,
	ComboboxContent,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "~/components/ui/combobox";
import {
	Command,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "~/components/ui/command";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "~/components/ui/context-menu";
import { Dialog, DialogTrigger } from "~/components/ui/dialog";
import { Drawer, DrawerTrigger } from "~/components/ui/drawer";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "~/components/ui/empty";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "~/components/ui/field";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
} from "~/components/ui/form";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "~/components/ui/hover-card";
import { Input } from "~/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "~/components/ui/input-group";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "~/components/ui/input-otp";
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "~/components/ui/item";
import { Kbd, KbdGroup } from "~/components/ui/kbd";
import { Label } from "~/components/ui/label";
import {
	Menubar,
	MenubarContent,
	MenubarItem,
	MenubarMenu,
	MenubarTrigger,
} from "~/components/ui/menubar";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import {
	NavigationMenu,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
} from "~/components/ui/navigation-menu";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "~/components/ui/pagination";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Progress } from "~/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "~/components/ui/resizable";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { Sheet, SheetTrigger } from "~/components/ui/sheet";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
} from "~/components/ui/sidebar";
import { Skeleton } from "~/components/ui/skeleton";
import { Slider } from "~/components/ui/slider";
import { Spinner } from "~/components/ui/spinner";
import { Switch } from "~/components/ui/switch";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";
import { Toggle } from "~/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";

// A preview renders the real primitive. Variant props (from the detail table) are spread
// onto components whose cva styles their root (button, badge, alert, toggle); others ignore them.
export type PreviewProps = Record<string, unknown>;
export type PreviewRender = (props?: PreviewProps) => ReactNode;

// Previews are invoked as plain functions (render(props)), not mounted as components, so any
// preview that needs hooks must live in its own module-level component referenced from previews.
function FormPreview() {
	const form = useForm({ defaultValues: { username: "" } });
	return (
		<Form {...form}>
			<form className="w-64 space-y-2">
				<FormField
					control={form.control}
					name="username"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Username</FormLabel>
							<FormControl>
								<Input placeholder="miami" {...field} />
							</FormControl>
							<FormDescription>Your public display name.</FormDescription>
						</FormItem>
					)}
				/>
			</form>
		</Form>
	);
}

function SidebarPreview() {
	return (
		<div className="h-72 w-full overflow-hidden rounded-md border border-border">
			<SidebarProvider className="min-h-0!">
				<Sidebar collapsible="none">
					<SidebarContent>
						<SidebarGroup>
							<SidebarGroupLabel>Platform</SidebarGroupLabel>
							<SidebarGroupContent>
								<SidebarMenu>
									<SidebarMenuItem>
										<SidebarMenuButton>
											<Icon icon="mdi:home-outline" />
											<span>Home</span>
										</SidebarMenuButton>
									</SidebarMenuItem>
									<SidebarMenuItem>
										<SidebarMenuButton isActive>
											<Icon icon="mdi:inbox-outline" />
											<span>Inbox</span>
										</SidebarMenuButton>
									</SidebarMenuItem>
									<SidebarMenuItem>
										<SidebarMenuButton>
											<Icon icon="mdi:cog-outline" />
											<span>Settings</span>
										</SidebarMenuButton>
									</SidebarMenuItem>
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>
					</SidebarContent>
				</Sidebar>
			</SidebarProvider>
		</div>
	);
}

const chartData = [
	{ month: "Jan", value: 42 },
	{ month: "Feb", value: 73 },
	{ month: "Mar", value: 58 },
];
const chartConfig = { value: { label: "Value", color: "var(--primary)" } } as const;

export const previews: Record<string, PreviewRender> = {
	accordion: () => (
		<Accordion type="single" collapsible className="w-64">
			<AccordionItem value="a">
				<AccordionTrigger>Is it themed?</AccordionTrigger>
				<AccordionContent>Yes — Miami Wind, dark only.</AccordionContent>
			</AccordionItem>
		</Accordion>
	),
	alert: (p) => (
		<Alert {...p} className="w-72">
			<Icon icon="mdi:information-outline" />
			<AlertTitle>Heads up</AlertTitle>
			<AlertDescription>A Miami Wind alert.</AlertDescription>
		</Alert>
	),
	"alert-dialog": () => (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button variant="outline">Show dialog</Button>
			</AlertDialogTrigger>
		</AlertDialog>
	),
	"aspect-ratio": () => (
		<div className="w-44">
			<AspectRatio ratio={16 / 9}>
				<div className="grid size-full place-items-center rounded-md bg-surface text-xs text-subtext0">
					16 / 9
				</div>
			</AspectRatio>
		</div>
	),
	avatar: () => (
		<Avatar>
			<AvatarFallback>MW</AvatarFallback>
		</Avatar>
	),
	badge: (p) => <Badge {...p}>Badge</Badge>,
	breadcrumb: () => (
		<Breadcrumb>
			<BreadcrumbList>
				<BreadcrumbItem>
					<BreadcrumbLink href="#">Home</BreadcrumbLink>
				</BreadcrumbItem>
				<BreadcrumbSeparator />
				<BreadcrumbItem>
					<BreadcrumbPage>Components</BreadcrumbPage>
				</BreadcrumbItem>
			</BreadcrumbList>
		</Breadcrumb>
	),
	button: (p) => {
		const size = typeof p?.size === "string" ? p.size : "";
		return <Button {...p}>{size.startsWith("icon") ? <Icon icon="mdi:star" /> : "Button"}</Button>;
	},
	"button-group": (p) => (
		<ButtonGroup {...p}>
			<Button variant="outline">Copy</Button>
			<Button variant="outline">Paste</Button>
			<ButtonGroupSeparator />
			<ButtonGroupText>Done</ButtonGroupText>
		</ButtonGroup>
	),
	calendar: () => <Calendar mode="single" className="rounded-md border border-border" />,
	carousel: () => (
		<Carousel className="w-56">
			<CarouselContent>
				<CarouselItem className="grid h-24 place-items-center rounded-md bg-surface text-sm text-subtext0">
					Slide 1
				</CarouselItem>
				<CarouselItem className="grid h-24 place-items-center rounded-md bg-surface text-sm text-subtext0">
					Slide 2
				</CarouselItem>
				<CarouselItem className="grid h-24 place-items-center rounded-md bg-surface text-sm text-subtext0">
					Slide 3
				</CarouselItem>
			</CarouselContent>
			<CarouselPrevious />
			<CarouselNext />
		</Carousel>
	),
	chart: () => (
		<ChartContainer config={chartConfig} className="h-40 w-64">
			<BarChart data={chartData}>
				<Bar dataKey="value" fill="var(--color-value)" radius={4} />
			</BarChart>
		</ChartContainer>
	),
	combobox: () => (
		<Combobox items={["Apple", "Banana", "Cherry"]}>
			<ComboboxInput placeholder="Pick a fruit…" className="w-56" />
			<ComboboxContent>
				<ComboboxList>
					<ComboboxItem value="Apple">Apple</ComboboxItem>
					<ComboboxItem value="Banana">Banana</ComboboxItem>
					<ComboboxItem value="Cherry">Cherry</ComboboxItem>
				</ComboboxList>
			</ComboboxContent>
		</Combobox>
	),
	card: () => (
		<Card className="w-64">
			<CardHeader>
				<CardTitle>Card title</CardTitle>
				<CardDescription>Card description.</CardDescription>
			</CardHeader>
			<CardContent className="text-sm text-subtext0">Card body content.</CardContent>
		</Card>
	),
	checkbox: () => (
		<div className="flex items-center gap-2">
			<Checkbox id="cb" defaultChecked />
			<Label htmlFor="cb">Accept terms</Label>
		</div>
	),
	collapsible: () => (
		<Collapsible className="w-64">
			<CollapsibleTrigger asChild>
				<Button variant="outline" size="sm">
					Toggle
				</Button>
			</CollapsibleTrigger>
			<CollapsibleContent className="mt-2 text-sm text-subtext0">
				Hidden content revealed.
			</CollapsibleContent>
		</Collapsible>
	),
	command: () => (
		<Command className="w-64 border border-border">
			<CommandInput placeholder="Search…" />
			<CommandList>
				<CommandGroup heading="Suggestions">
					<CommandItem>Calendar</CommandItem>
					<CommandItem>Search</CommandItem>
				</CommandGroup>
			</CommandList>
		</Command>
	),
	"context-menu": () => (
		<ContextMenu>
			<ContextMenuTrigger className="grid h-16 w-48 place-items-center rounded-md border border-dashed border-border text-sm text-subtext0">
				Right-click here
			</ContextMenuTrigger>
			<ContextMenuContent>
				<ContextMenuItem>Back</ContextMenuItem>
				<ContextMenuItem>Reload</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	),
	dialog: () => (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="outline">Open dialog</Button>
			</DialogTrigger>
		</Dialog>
	),
	drawer: () => (
		<Drawer>
			<DrawerTrigger asChild>
				<Button variant="outline">Open drawer</Button>
			</DrawerTrigger>
		</Drawer>
	),
	"dropdown-menu": () => (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline">Open menu</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				<DropdownMenuItem>Profile</DropdownMenuItem>
				<DropdownMenuItem>Settings</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	),
	empty: () => (
		<Empty className="w-64 border border-border">
			<EmptyHeader>
				<EmptyMedia variant="icon">
					<Icon icon="mdi:folder-open-outline" />
				</EmptyMedia>
				<EmptyTitle>No projects</EmptyTitle>
				<EmptyDescription>Create your first project to get started.</EmptyDescription>
			</EmptyHeader>
			<EmptyContent>
				<Button size="sm">New project</Button>
			</EmptyContent>
		</Empty>
	),
	field: () => (
		<FieldGroup className="w-64">
			<Field>
				<FieldLabel htmlFor="field-preview">Email</FieldLabel>
				<Input id="field-preview" placeholder="you@example.com" />
				<FieldDescription>We will never share it.</FieldDescription>
			</Field>
		</FieldGroup>
	),
	form: () => <FormPreview />,
	"hover-card": () => (
		<HoverCard>
			<HoverCardTrigger asChild>
				<Button variant="link">@miami-wind</Button>
			</HoverCardTrigger>
			<HoverCardContent>A dark-only shadcn registry.</HoverCardContent>
		</HoverCard>
	),
	icon: (p) => <Icon icon={(p?.icon as string) ?? "mdi:home"} size={(p?.size as number) ?? 28} />,
	input: () => <Input placeholder="Email" className="w-64" />,
	"input-group": () => (
		<InputGroup className="w-64">
			<InputGroupAddon>
				<Icon icon="mdi:magnify" />
			</InputGroupAddon>
			<InputGroupInput placeholder="Search…" />
		</InputGroup>
	),
	"input-otp": () => (
		<InputOTP maxLength={4} containerClassName="w-fit">
			<InputOTPGroup>
				<InputOTPSlot index={0} />
				<InputOTPSlot index={1} />
				<InputOTPSlot index={2} />
				<InputOTPSlot index={3} />
			</InputOTPGroup>
		</InputOTP>
	),
	item: (p) => (
		<Item {...p} variant="outline" className="w-64">
			<ItemMedia variant="icon">
				<Icon icon="mdi:music" />
			</ItemMedia>
			<ItemContent>
				<ItemTitle>Now playing</ItemTitle>
				<ItemDescription>Miami Wind — Ambient mix</ItemDescription>
			</ItemContent>
		</Item>
	),
	kbd: () => (
		<KbdGroup>
			<Kbd>⌘</Kbd>
			<Kbd>K</Kbd>
		</KbdGroup>
	),
	label: () => <Label>Label</Label>,
	menubar: () => (
		<Menubar>
			<MenubarMenu>
				<MenubarTrigger>File</MenubarTrigger>
				<MenubarContent>
					<MenubarItem>New</MenubarItem>
					<MenubarItem>Open</MenubarItem>
				</MenubarContent>
			</MenubarMenu>
		</Menubar>
	),
	"native-select": () => (
		<NativeSelect defaultValue="banana">
			<NativeSelectOption value="apple">Apple</NativeSelectOption>
			<NativeSelectOption value="banana">Banana</NativeSelectOption>
			<NativeSelectOption value="cherry">Cherry</NativeSelectOption>
		</NativeSelect>
	),
	"navigation-menu": () => (
		<NavigationMenu>
			<NavigationMenuList>
				<NavigationMenuItem>
					<NavigationMenuLink className="px-3 py-2 text-sm">Home</NavigationMenuLink>
				</NavigationMenuItem>
				<NavigationMenuItem>
					<NavigationMenuLink className="px-3 py-2 text-sm">Docs</NavigationMenuLink>
				</NavigationMenuItem>
			</NavigationMenuList>
		</NavigationMenu>
	),
	pagination: () => (
		<Pagination>
			<PaginationContent>
				<PaginationItem>
					<PaginationPrevious href="#" />
				</PaginationItem>
				<PaginationItem>
					<PaginationLink href="#" isActive>
						1
					</PaginationLink>
				</PaginationItem>
				<PaginationItem>
					<PaginationNext href="#" />
				</PaginationItem>
			</PaginationContent>
		</Pagination>
	),
	popover: () => (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant="outline">Open popover</Button>
			</PopoverTrigger>
			<PopoverContent>Popover content.</PopoverContent>
		</Popover>
	),
	progress: () => <Progress value={62} className="w-64" />,
	"radio-group": () => (
		<RadioGroup defaultValue="a">
			<div className="flex items-center gap-2">
				<RadioGroupItem value="a" id="r-a" />
				<Label htmlFor="r-a">Option A</Label>
			</div>
			<div className="flex items-center gap-2">
				<RadioGroupItem value="b" id="r-b" />
				<Label htmlFor="r-b">Option B</Label>
			</div>
		</RadioGroup>
	),
	resizable: () => (
		<ResizablePanelGroup
			orientation="horizontal"
			className="h-32 w-64 rounded-md border border-border"
		>
			<ResizablePanel defaultSize={50}>
				<div className="grid h-full place-items-center p-2 text-sm text-subtext0">One</div>
			</ResizablePanel>
			<ResizableHandle withHandle />
			<ResizablePanel defaultSize={50}>
				<div className="grid h-full place-items-center p-2 text-sm text-subtext0">Two</div>
			</ResizablePanel>
		</ResizablePanelGroup>
	),
	"scroll-area": () => (
		<ScrollArea className="h-24 w-56 rounded-md border border-border p-3 text-sm text-subtext0">
			Miami Wind blends Tailwind accents with a Catppuccin-mocha greyscale into a dark-only system
			used across editors, terminals, and now this workbench.
		</ScrollArea>
	),
	select: () => (
		<Select>
			<SelectTrigger className="w-44">
				<SelectValue placeholder="Pick one" />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="a">Apple</SelectItem>
				<SelectItem value="b">Banana</SelectItem>
			</SelectContent>
		</Select>
	),
	separator: () => (
		<div className="w-56 text-sm text-subtext0">
			Above
			<Separator className="my-2" />
			Below
		</div>
	),
	sheet: () => (
		<Sheet>
			<SheetTrigger asChild>
				<Button variant="outline">Open sheet</Button>
			</SheetTrigger>
		</Sheet>
	),
	sidebar: () => <SidebarPreview />,
	skeleton: () => (
		<div className="flex w-64 flex-col gap-2">
			<Skeleton className="h-4 w-3/4" />
			<Skeleton className="h-4 w-1/2" />
			<Skeleton className="h-4 w-5/6" />
		</div>
	),
	slider: () => <Slider defaultValue={[50]} max={100} step={1} className="w-64" />,
	spinner: (p) => <Spinner {...p} className="size-6" />,
	sonner: () => (
		<Button
			variant="outline"
			onClick={() => toast("Event created", { description: "Miami Wind toast." })}
		>
			Show toast
		</Button>
	),
	switch: () => (
		<div className="flex items-center gap-2">
			<Switch id="sw" defaultChecked />
			<Label htmlFor="sw">Airplane mode</Label>
		</div>
	),
	table: () => (
		<Table className="w-72">
			<TableHeader>
				<TableRow>
					<TableHead>Status</TableHead>
					<TableHead className="text-right">Amount</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				<TableRow>
					<TableCell>Success</TableCell>
					<TableCell className="text-right tabular-nums">$316.00</TableCell>
				</TableRow>
				<TableRow>
					<TableCell>Pending</TableCell>
					<TableCell className="text-right tabular-nums">$242.00</TableCell>
				</TableRow>
			</TableBody>
		</Table>
	),
	tabs: () => (
		<Tabs defaultValue="account" className="w-64">
			<TabsList>
				<TabsTrigger value="account">Account</TabsTrigger>
				<TabsTrigger value="password">Password</TabsTrigger>
			</TabsList>
			<TabsContent value="account" className="text-sm text-subtext0">
				Account settings.
			</TabsContent>
			<TabsContent value="password" className="text-sm text-subtext0">
				Password settings.
			</TabsContent>
		</Tabs>
	),
	textarea: () => <Textarea placeholder="Type a message…" className="w-64" />,
	toggle: (p) => (
		<Toggle {...p} aria-label="Bold">
			<Icon icon="mdi:format-bold" />
		</Toggle>
	),
	"toggle-group": () => (
		<ToggleGroup type="single" defaultValue="left">
			<ToggleGroupItem value="left" aria-label="Left">
				<Icon icon="mdi:format-align-left" />
			</ToggleGroupItem>
			<ToggleGroupItem value="center" aria-label="Center">
				<Icon icon="mdi:format-align-center" />
			</ToggleGroupItem>
			<ToggleGroupItem value="right" aria-label="Right">
				<Icon icon="mdi:format-align-right" />
			</ToggleGroupItem>
		</ToggleGroup>
	),
	tooltip: () => (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button variant="outline">Hover me</Button>
			</TooltipTrigger>
			<TooltipContent>Tooltip content</TooltipContent>
		</Tooltip>
	),
};
