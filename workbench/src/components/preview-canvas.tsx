import { Icon } from "@registry-ui/icon";
import { type MouseEvent, type ReactNode, useCallback, useEffect, useState } from "react";
import { highlight } from "sugar-high";
import { CardsScene } from "~/components/scenes/cards-scene";
import { MailScene } from "~/components/scenes/mail-scene";
import { MarketingScene } from "~/components/scenes/marketing-scene";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "~/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Progress } from "~/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Separator } from "~/components/ui/separator";
import { Slider } from "~/components/ui/slider";
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
import { useScene } from "~/stores/scene";
import { client } from "~/utils/api";
import { cn } from "~/utils/cn";

export function PreviewCanvas({ variantStrip }: { variantStrip?: ReactNode }) {
	const scene = useScene((s) => s.scene);
	const [source, setSource] = useState<SourceHit | null>(null);

	// Click any stamped scene element → fetch + show its TSX. Clicks on the variant strip,
	// surfaces, or tab buttons carry no [data-loc] and fall through untouched.
	const onPreviewClick = useCallback((e: MouseEvent<HTMLDivElement>) => {
		const el = (e.target as HTMLElement).closest<HTMLElement>("[data-loc]");
		const loc = el?.dataset.loc;
		if (!loc) return;
		// "<path>:<start>:<end>" — path may itself be empty of colons, so split from the right.
		const end = loc.lastIndexOf(":");
		const startSep = loc.lastIndexOf(":", end - 1);
		const path = loc.slice(0, startSep);
		const start = Number(loc.slice(startSep + 1, end));
		const endN = Number(loc.slice(end + 1));
		e.preventDefault();
		setSource({ path, start, end: endN, code: null });
		// Only the latest click wins: a stale response for a different element is dropped.
		const fresh = (s: SourceHit | null) => s && s.path === path && s.start === start;
		(async () => {
			try {
				const res = await client.api.source.$get({
					query: { path, start: String(start), end: String(endN) },
				});
				const code = res.ok
					? (await res.json()).source
					: `// could not load source (${res.status})`;
				setSource((s) => (fresh(s) ? { ...(s as SourceHit), code } : s));
			} catch {
				setSource((s) => (fresh(s) ? { ...(s as SourceHit), code: "// failed to load" } : s));
			}
		})();
	}, []);

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			{/* biome-ignore lint/a11y/noStaticElementInteractions: dev-only click-to-source on the scene canvas. */}
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: source inspection is a pointer affordance. */}
			<div data-preview className="min-h-0 flex-1 overflow-auto p-6" onClick={onPreviewClick}>
				{variantStrip}
				{scene === "dashboard" && <Dashboard />}
				{scene === "cards" && <CardsScene />}
				{scene === "mail" && <MailScene />}
				{scene === "marketing" && <MarketingScene />}
				{scene === "forms" && <Forms />}
				{scene === "surfaces" && <Surfaces />}
			</div>
			{source && <SceneSourceDialog hit={source} onClose={() => setSource(null)} />}
		</div>
	);
}

// --- Click-to-source popover -------------------------------------------------

type SourceHit = {
	path: string;
	start: number;
	end: number;
	code: string | null;
};

// A centered modal showing the clicked element's source. Closes on Escape or a backdrop click.
// Kept simple: no portal/focus-trap library — it's a dev-only source viewer.
function SceneSourceDialog({ hit, onClose }: { hit: SourceHit; onClose: () => void }) {
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onClose]);

	const file = hit.path.replace("src/components/", "");

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: backdrop click-to-dismiss for a dev tool.
		// biome-ignore lint/a11y/useKeyWithClickEvents: Escape handles keyboard dismissal.
		<div
			className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
			onClick={(e) => {
				if (e.target === e.currentTarget) onClose();
			}}
		>
			<div
				role="dialog"
				aria-modal="true"
				aria-label={`Source: ${file}`}
				className="flex max-h-[85vh] w-[min(90vw,72rem)] flex-col overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg"
			>
				<div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-2.5">
					<span className="truncate font-mono text-xs text-subtext0">{file}</span>
					<div className="flex shrink-0 items-center gap-1">
						<button
							type="button"
							onClick={() => {
								if (!hit.code) return;
								navigator.clipboard?.writeText(hit.code);
								setCopied(true);
								setTimeout(() => setCopied(false), 1200);
							}}
							className="cursor-pointer rounded-sm p-1 text-subtext0 transition-colors hover:bg-accent hover:text-accent-foreground"
							title="Copy source"
						>
							<Icon icon={copied ? "mdi:check" : "mdi:content-copy"} size={16} />
						</button>
						<button
							type="button"
							onClick={onClose}
							className="cursor-pointer rounded-sm p-1 text-subtext0 transition-colors hover:bg-accent hover:text-accent-foreground"
							title="Close"
						>
							<Icon icon="mdi:close" size={16} />
						</button>
					</div>
				</div>
				<pre className="sh-code min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap break-words p-4 font-mono text-xs leading-relaxed text-foreground">
					{hit.code == null ? (
						<code className="text-subtext0">Loading…</code>
					) : (
						// biome-ignore lint/security/noDangerouslySetInnerHtml: sugar-high escapes the code; the source is our own path-guarded src/ slice.
						<code dangerouslySetInnerHTML={{ __html: highlight(hit.code) }} />
					)}
				</pre>
			</div>
		</div>
	);
}

// --- Dashboard ---------------------------------------------------------------

function Dashboard() {
	return (
		<div className="mx-auto flex max-w-5xl flex-col gap-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-semibold tracking-tight">Overview</h2>
					<p className="text-sm text-subtext0">Your team's activity this month.</p>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm">
						<Icon icon="mdi:download" /> Export
					</Button>
					<Button size="sm">
						<Icon icon="mdi:plus" /> New report
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				{[
					["Revenue", "$15,231", "+20.1%"],
					["Subscriptions", "+2,350", "+180%"],
					["Sales", "12,234", "+19%"],
					["Active now", "573", "+201"],
				].map(([title, value, delta]) => (
					<Card key={title}>
						<CardHeader>
							<CardDescription>{title}</CardDescription>
							<CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
						</CardHeader>
						<CardContent className="text-xs text-success">{delta} from last month</CardContent>
					</Card>
				))}
			</div>

			<div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
				<Card>
					<CardHeader className="flex-row items-center justify-between">
						<CardTitle>Payments</CardTitle>
						<Badge variant="secondary">14 pending</Badge>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Customer</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className="text-right">Amount</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{[
									["ken99@example.com", "Success", "$316.00"],
									["abe45@example.com", "Processing", "$242.00"],
									["monserrat@example.com", "Success", "$837.00"],
								].map(([email, status, amount]) => (
									<TableRow key={email}>
										<TableCell>{email}</TableCell>
										<TableCell>
											<Badge variant={status === "Success" ? "default" : "outline"}>{status}</Badge>
										</TableCell>
										<TableCell className="text-right tabular-nums">{amount}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Goals</CardTitle>
						<CardDescription>Monthly progress</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-4">
						<div className="flex items-center gap-3">
							<Avatar>
								<AvatarFallback>MW</AvatarFallback>
							</Avatar>
							<div className="text-sm">
								<div className="font-medium text-text">Sofia Davis</div>
								<div className="text-subtext0">m@example.com</div>
							</div>
						</div>
						<div>
							<div className="mb-1 flex justify-between text-xs text-subtext0">
								<span>Storage</span>
								<span className="tabular-nums">62%</span>
							</div>
							<Progress value={62} />
						</div>
						<Alert>
							<Icon icon="mdi:rocket-launch-outline" />
							<AlertTitle>On track</AlertTitle>
							<AlertDescription>You're ahead of your goal.</AlertDescription>
						</Alert>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

// --- Forms -------------------------------------------------------------------

function Forms() {
	return (
		<div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2">
			<Card>
				<CardHeader>
					<CardTitle>Create an account</CardTitle>
					<CardDescription>Enter your details to get started.</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					<div className="grid grid-cols-2 gap-3">
						<Button variant="outline">
							<Icon icon="mdi:github" /> GitHub
						</Button>
						<Button variant="outline">
							<Icon icon="mdi:google" /> Google
						</Button>
					</div>
					<div className="flex items-center gap-3 text-xs text-subtext0">
						<Separator className="flex-1" /> OR <Separator className="flex-1" />
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="p-email">Email</Label>
						<Input id="p-email" type="email" placeholder="m@example.com" />
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="p-pw">Password</Label>
						<Input id="p-pw" type="password" placeholder="••••••••" />
					</div>
					<Button className="w-full">Create account</Button>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Preferences</CardTitle>
					<CardDescription>Manage how the app behaves.</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-5">
					<div className="flex items-center justify-between">
						<Label htmlFor="p-notify">Email notifications</Label>
						<Switch id="p-notify" defaultChecked />
					</div>
					<div className="flex items-center justify-between">
						<Label htmlFor="p-terms" className="flex items-center gap-2">
							<Checkbox id="p-terms" defaultChecked /> Accept terms
						</Label>
					</div>
					<div className="flex flex-col gap-2">
						<Label>Plan</Label>
						<RadioGroup defaultValue="pro" className="flex flex-col gap-2">
							<Label className="flex items-center gap-2 font-normal">
								<RadioGroupItem value="free" /> Free
							</Label>
							<Label className="flex items-center gap-2 font-normal">
								<RadioGroupItem value="pro" /> Pro
							</Label>
						</RadioGroup>
					</div>
					<div className="flex flex-col gap-2">
						<Label>Volume</Label>
						<Slider defaultValue={[60]} max={100} />
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="p-msg">Message</Label>
						<Textarea id="p-msg" placeholder="Tell us what you think…" />
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

// --- Surfaces (portal components rendered open & inline, always visible) ------

function Surfaces() {
	return (
		<div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
			<Labeled label="Dropdown menu">
				<MenuSurface
					items={[
						["mdi:account-outline", "Profile"],
						["mdi:cog-outline", "Settings"],
						["mdi:credit-card-outline", "Billing"],
						["mdi:logout", "Log out"],
					]}
				/>
			</Labeled>

			<Labeled label="Command">
				<div className="overflow-hidden rounded-md border border-border bg-popover text-popover-foreground">
					<div className="flex items-center gap-2 border-b border-border px-3 py-2 text-sm text-subtext0">
						<Icon icon="mdi:magnify" size={16} /> Search…
					</div>
					<MenuSurface
						bare
						items={[
							["mdi:calendar", "Calendar"],
							["mdi:emoticon-outline", "Search emoji"],
							["mdi:calculator", "Calculator"],
						]}
					/>
				</div>
			</Labeled>

			<Labeled label="Select">
				<div className="rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md">
					{["Light", "Dark", "System"].map((o, i) => (
						<div
							key={o}
							className={cn(
								"flex items-center justify-between rounded-sm px-2 py-1.5 text-sm",
								i === 1 ? "bg-accent text-accent-foreground" : "",
							)}
						>
							{o}
							{i === 1 && <Icon icon="mdi:check" size={16} />}
						</div>
					))}
				</div>
			</Labeled>

			<Labeled label="Popover">
				<div className="rounded-md border border-border bg-popover p-4 text-popover-foreground shadow-md">
					<div className="font-medium text-text">Dimensions</div>
					<p className="mt-1 text-sm text-subtext0">Set the layout dimensions.</p>
					<div className="mt-3 flex items-center justify-between gap-2 text-sm">
						<span>Width</span>
						<Input defaultValue="100%" className="h-8 w-24" />
					</div>
				</div>
			</Labeled>

			<Labeled label="Dialog">
				<div className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-lg">
					<div className="text-lg font-semibold">Delete project</div>
					<p className="mt-1 text-sm text-subtext0">This action cannot be undone.</p>
					<div className="mt-4 flex justify-end gap-2">
						<Button variant="outline" size="sm">
							Cancel
						</Button>
						<Button variant="destructive" size="sm">
							Delete
						</Button>
					</div>
				</div>
			</Labeled>

			<Labeled label="Tooltip & accordion">
				<div className="flex flex-col gap-3">
					<div className="self-start rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground shadow-md">
						Add to library
					</div>
					<Accordion
						type="single"
						collapsible
						defaultValue="a"
						className="rounded-md border border-border px-3"
					>
						<AccordionItem value="a" className="border-none">
							<AccordionTrigger>Is it accessible?</AccordionTrigger>
							<AccordionContent>Yes — it follows WAI-ARIA.</AccordionContent>
						</AccordionItem>
					</Accordion>
				</div>
			</Labeled>

			<div className="md:col-span-2 lg:col-span-3">
				<Tabs defaultValue="music">
					<TabsList>
						<TabsTrigger value="music">Music</TabsTrigger>
						<TabsTrigger value="podcasts">Podcasts</TabsTrigger>
						<TabsTrigger value="live">Live</TabsTrigger>
					</TabsList>
					<TabsContent value="music" className="pt-3 text-sm text-subtext0">
						Listen to the latest releases from your library.
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}

// Themed surface mirroring shadcn's menu content — always visible, reacts to theme edits.
function MenuSurface({ items, bare = false }: { items: [string, string][]; bare?: boolean }) {
	return (
		<div
			className={cn(
				"p-1 text-popover-foreground",
				bare ? "" : "rounded-md border border-border bg-popover shadow-md",
			)}
		>
			{items.map(([icon, label]) => (
				<div
					key={label}
					className="flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
				>
					<Icon icon={icon} size={16} />
					{label}
				</div>
			))}
		</div>
	);
}

function Labeled({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className="flex flex-col gap-2">
			<span className="text-xs font-medium uppercase tracking-wide text-subtext0">{label}</span>
			{children}
		</div>
	);
}
