import { Icon } from "@registry-ui/icon";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Separator } from "~/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/utils/cn";

type Folder = {
	id: string;
	label: string;
	icon: string;
	count?: number;
};

const primaryFolders: Folder[] = [
	{ id: "inbox", label: "Inbox", icon: "mdi:inbox", count: 128 },
	{ id: "drafts", label: "Drafts", icon: "mdi:file-outline", count: 9 },
	{ id: "sent", label: "Sent", icon: "mdi:send-outline" },
	{ id: "junk", label: "Junk", icon: "mdi:alert-octagon-outline", count: 23 },
	{ id: "trash", label: "Trash", icon: "mdi:trash-can-outline" },
	{ id: "archive", label: "Archive", icon: "mdi:archive-outline" },
];

const secondaryFolders: Folder[] = [
	{ id: "social", label: "Social", icon: "mdi:account-group-outline", count: 972 },
	{ id: "updates", label: "Updates", icon: "mdi:information-outline", count: 342 },
	{ id: "forums", label: "Forums", icon: "mdi:forum-outline", count: 128 },
	{ id: "shopping", label: "Shopping", icon: "mdi:cart-outline", count: 8 },
	{ id: "promotions", label: "Promotions", icon: "mdi:tag-outline", count: 21 },
];

type Mail = {
	id: string;
	sender: string;
	initials: string;
	subject: string;
	snippet: string;
	time: string;
	tags: string[];
};

const mails: Mail[] = [
	{
		id: "m1",
		sender: "William Smith",
		initials: "WS",
		subject: "Meeting Tomorrow",
		snippet:
			"Hi, let's have a meeting tomorrow to discuss the project. I've been reviewing the timeline and think we should align before the standup.",
		time: "9:00 AM",
		tags: ["meeting", "work", "important"],
	},
	{
		id: "m2",
		sender: "Alice Smith",
		initials: "AS",
		subject: "Re: Project Update",
		snippet:
			"Thank you for the update. The progress looks great so far. Could you share the latest figures before our sync so I can prep the deck?",
		time: "Yesterday",
		tags: ["work", "important"],
	},
	{
		id: "m3",
		sender: "Bob Johnson",
		initials: "BJ",
		subject: "Weekend Plans",
		snippet:
			"Are we still on for hiking this weekend? The weather forecast looks clear and I found a new trail near the lake we could try out.",
		time: "2 days ago",
		tags: ["personal"],
	},
	{
		id: "m4",
		sender: "Emily Davis",
		initials: "ED",
		subject: "Re: Question about Budget",
		snippet:
			"I had a quick question about the Q3 budget allocation. The marketing line seems higher than we discussed — can we walk through it?",
		time: "2 days ago",
		tags: ["budget", "work"],
	},
	{
		id: "m5",
		sender: "Michael Wilson",
		initials: "MW",
		subject: "Important Announcement",
		snippet:
			"Please read this important announcement regarding the upcoming office relocation. New badges will be issued next week for all staff.",
		time: "Oct 18",
		tags: ["important"],
	},
	{
		id: "m6",
		sender: "Sarah Brown",
		initials: "SB",
		subject: "Re: Feedback on Proposal",
		snippet:
			"Thanks for sending the proposal over. Overall it reads well — I left a few comments on the pricing section we should resolve together.",
		time: "Oct 17",
		tags: ["work", "important"],
	},
	{
		id: "m7",
		sender: "David Lee",
		initials: "DL",
		subject: "New Project Idea",
		snippet:
			"I have a new project idea I'd love to run by you. It builds on the analytics work and could open up a whole new customer segment.",
		time: "Oct 16",
		tags: ["work", "meeting"],
	},
	{
		id: "m8",
		sender: "Olivia Wilson",
		initials: "OW",
		subject: "Vacation Plans",
		snippet:
			"Just wanted to let you know I'll be out of office next month. I'll hand off my open tickets and make sure coverage is in place.",
		time: "Oct 14",
		tags: ["personal"],
	},
];

function NavItem({ folder, active = false }: { folder: Folder; active?: boolean }) {
	return (
		<button
			type="button"
			className={cn(
				"flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
				active
					? "bg-interactive text-text"
					: "text-subtext0 hover:bg-interactive/60 hover:text-text",
			)}
		>
			<Icon icon={folder.icon} size={16} />
			<span className="flex-1 truncate text-left">{folder.label}</span>
			{folder.count !== undefined && <span className="text-xs tabular-nums">{folder.count}</span>}
		</button>
	);
}

function MailRow({ mail, selected = false }: { mail: Mail; selected?: boolean }) {
	return (
		<button
			type="button"
			className={cn(
				"flex w-full cursor-pointer flex-col gap-1.5 border-b border-border p-3 text-left transition-colors hover:bg-interactive",
				selected && "bg-interactive ring-1 ring-border ring-inset",
			)}
		>
			<div className="flex items-center justify-between gap-2">
				<span className="font-medium text-text">{mail.sender}</span>
				<span className="shrink-0 text-xs text-subtext0">{mail.time}</span>
			</div>
			<span className="text-sm text-subtext">{mail.subject}</span>
			<span className="line-clamp-2 text-xs text-subtext0">{mail.snippet}</span>
			<div className="mt-1 flex flex-wrap gap-1.5">
				{mail.tags.map((tag) => (
					<Badge key={tag} variant="secondary" className="rounded-md px-1.5 py-0">
						{tag}
					</Badge>
				))}
			</div>
		</button>
	);
}

export function MailScene() {
	return (
		<div className="mx-auto h-[40rem] max-w-6xl overflow-hidden rounded-lg border border-border">
			<div className="flex h-full">
				{/* PANE A — sidebar */}
				<aside className="flex w-52 shrink-0 flex-col border-r border-border bg-mantle p-2">
					<button
						type="button"
						className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-interactive/60"
					>
						<Avatar size="sm">
							<AvatarFallback>AK</AvatarFallback>
						</Avatar>
						<span className="flex-1 truncate text-sm font-medium text-text">Alicia Koch</span>
						<Icon icon="mdi:chevron-down" size={16} className="text-subtext0" />
					</button>

					<Separator className="my-2" />

					<nav className="flex flex-col gap-0.5">
						{primaryFolders.map((folder) => (
							<NavItem key={folder.id} folder={folder} active={folder.id === "inbox"} />
						))}
					</nav>

					<Separator className="my-2" />

					<nav className="flex flex-col gap-0.5">
						{secondaryFolders.map((folder) => (
							<NavItem key={folder.id} folder={folder} />
						))}
					</nav>
				</aside>

				{/* PANE B — message list */}
				<section className="flex w-80 shrink-0 flex-col border-r border-border">
					<div className="flex items-center justify-between p-3">
						<h2 className="text-lg font-bold text-text">Inbox</h2>
						<Tabs defaultValue="all">
							<TabsList variant="line">
								<TabsTrigger value="all">All mail</TabsTrigger>
								<TabsTrigger value="unread">Unread</TabsTrigger>
							</TabsList>
						</Tabs>
					</div>

					<div className="px-3 pb-3">
						<div className="relative">
							<Icon
								icon="mdi:magnify"
								size={16}
								className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-subtext0"
							/>
							<Input placeholder="Search" className="pl-8" />
						</div>
					</div>

					<div className="flex-1 overflow-auto">
						{mails.map((mail, index) => (
							<MailRow key={mail.id} mail={mail} selected={index === 0} />
						))}
					</div>
				</section>

				{/* PANE C — reading pane */}
				<article className="flex flex-1 flex-col">
					<div className="flex items-center gap-1 border-b border-border p-2">
						<Button variant="ghost" size="icon" aria-label="Archive">
							<Icon icon="mdi:archive-outline" size={16} />
						</Button>
						<Button variant="ghost" size="icon" aria-label="Move to trash">
							<Icon icon="mdi:trash-can-outline" size={16} />
						</Button>
						<Button variant="ghost" size="icon" aria-label="Snooze">
							<Icon icon="mdi:clock-outline" size={16} />
						</Button>
						<div className="flex-1" />
						<Button variant="ghost" size="icon" aria-label="Reply">
							<Icon icon="mdi:reply" size={16} />
						</Button>
						<Button variant="ghost" size="icon" aria-label="Reply all">
							<Icon icon="mdi:reply-all" size={16} />
						</Button>
						<Button variant="ghost" size="icon" aria-label="Forward">
							<Icon icon="mdi:forward" size={16} />
						</Button>
						<Button variant="ghost" size="icon" aria-label="More options">
							<Icon icon="mdi:dots-vertical" size={16} />
						</Button>
					</div>

					<div className="flex items-start gap-4 p-4">
						<Avatar>
							<AvatarFallback>WS</AvatarFallback>
						</Avatar>
						<div className="flex flex-1 flex-col gap-0.5">
							<span className="font-semibold text-text">William Smith</span>
							<span className="text-sm font-medium text-subtext">Meeting Tomorrow</span>
							<span className="text-xs text-subtext0">Reply-To: williamsmith@example.com</span>
						</div>
						<span className="shrink-0 text-xs text-subtext0">Oct 22, 2023, 9:00 AM</span>
					</div>

					<Separator />

					<div className="flex-1 space-y-4 overflow-auto p-4 text-sm leading-relaxed text-subtext">
						<p>
							Hi team, I wanted to set up a quick meeting tomorrow morning so we can align on the
							project before the broader standup. There are a couple of open decisions on scope that
							I'd like everyone's input on.
						</p>
						<p>
							Could you each review the latest timeline and the updated budget figures beforehand?
							If anything looks off, drop your notes in the shared doc and we'll work through them
							together. I'd rather catch surprises now than mid-sprint.
						</p>
						<p>
							Let's plan for 9:00 AM in the main room. It shouldn't take more than thirty minutes,
							and we'll come out with a clear set of next steps for the week.
						</p>
						<p>
							Best regards,
							<br />
							William
						</p>
					</div>

					<div className="border-t border-border p-3">
						<Textarea placeholder="Reply William Smith..." className="min-h-20 bg-base" />
						<div className="mt-3 flex justify-end">
							<Button>Send</Button>
						</div>
					</div>
				</article>
			</div>
		</div>
	);
}
