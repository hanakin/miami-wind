import { Icon } from "@registry-ui/icon";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "~/components/ui/accordion";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { cn } from "~/utils/cn";

const navLinks = ["Products", "Solutions", "Pricing", "Company"] as const;

const logoCloud = ["Logoipsum", "Acmevia", "Globex", "Initech", "Northwind"] as const;

type FeatureItem = {
	id: string;
	icon: string;
	title: string;
	description: string;
};

const features: FeatureItem[] = [
	{
		id: "analytics",
		icon: "mdi:chart-line",
		title: "Smarter Analytics",
		description:
			"Surface the signals that matter with dashboards that update the moment your data does.",
	},
	{
		id: "workflow",
		icon: "mdi:sync",
		title: "Seamless Workflow",
		description:
			"Connect the tools your team already loves and keep every project moving in one flow.",
	},
	{
		id: "alignment",
		icon: "mdi:account-group-outline",
		title: "Team Alignment",
		description: "Shared context and live updates keep everyone pointed at the same outcome.",
	},
	{
		id: "decisions",
		icon: "mdi:check-decagram-outline",
		title: "Clear Decisions",
		description:
			"Turn raw numbers into confident calls with recommendations you can actually trust.",
	},
];

type StatItem = {
	id: string;
	value: string;
	label: string;
};

const stats: StatItem[] = [
	{ id: "projects", value: "12,500+", label: "Projects created" },
	{ id: "delivery", value: "38%", label: "Faster delivery" },
	{ id: "satisfaction", value: "94%", label: "User satisfaction" },
	{ id: "zones", value: "8 zones", label: "Active customers" },
];

type PricingTierData = {
	id: string;
	name: string;
	price: string;
	description: string;
	featured: boolean;
	features: string[];
};

const pricingTiers: PricingTierData[] = [
	{
		id: "starter",
		name: "Starter",
		price: "$10",
		description: "For individuals testing the waters.",
		featured: false,
		features: [
			"Up to 3 active projects",
			"Core analytics dashboard",
			"1 connected workspace",
			"Community support",
		],
	},
	{
		id: "pro",
		name: "Pro",
		price: "$24",
		description: "For growing teams that ship often.",
		featured: true,
		features: [
			"Unlimited active projects",
			"Advanced analytics and trends",
			"5 connected workspaces",
			"Priority email support",
			"Custom decision templates",
		],
	},
	{
		id: "enterprise",
		name: "Enterprise",
		price: "$48",
		description: "For organizations that need scale.",
		featured: false,
		features: [
			"Everything in Pro",
			"Single sign-on (SSO)",
			"Dedicated success manager",
			"Audit logs and controls",
			"99.9% uptime SLA",
		],
	},
];

type FaqItem = {
	id: string;
	question: string;
	answer: string;
};

const faqs: FaqItem[] = [
	{
		id: "q1",
		question: "What is Acme AI?",
		answer:
			"Acme AI is a decision platform that connects your data, surfaces clear insights, and recommends the next best move so your team can act with confidence.",
	},
	{
		id: "q2",
		question: "Who is Acme AI for?",
		answer:
			"It is built for product, operations, and leadership teams who need to align quickly and make data-backed decisions without waiting on a separate analyst.",
	},
	{
		id: "q3",
		question: "How much does it cost?",
		answer:
			"Plans start at $10 per month for individuals and scale to Enterprise pricing for larger organizations. You only pay for the seats and workspaces you use.",
	},
	{
		id: "q4",
		question: "Do I need technical skills?",
		answer:
			"Not at all. Acme AI is designed for non-technical users, with guided setup and plain-language insights. Your engineers can go deeper with the API when they want to.",
	},
	{
		id: "q5",
		question: "Can I try it before I buy?",
		answer:
			"Yes. Every plan includes a free 14-day trial with full access to features, and no credit card is required to get started.",
	},
];

type FooterColumn = {
	id: string;
	heading: string;
	links: string[];
};

const footerColumns: FooterColumn[] = [
	{
		id: "product",
		heading: "Product",
		links: ["Features", "Integrations", "Pricing", "Changelog"],
	},
	{ id: "company", heading: "Company", links: ["About", "Careers", "Blog", "Press"] },
	{
		id: "resources",
		heading: "Resources",
		links: ["Documentation", "Guides", "Support", "API status"],
	},
	{ id: "legal", heading: "Legal", links: ["Privacy", "Terms", "Security", "Cookies"] },
];

function NavLink({ label }: { label: string }) {
	return (
		<button type="button" className="text-sm text-subtext0 transition-colors hover:text-text">
			{label}
		</button>
	);
}

function Feature({ feature }: { feature: FeatureItem }) {
	return (
		<Card>
			<CardHeader>
				<div className="grid size-10 place-items-center rounded-lg bg-interactive text-primary">
					<Icon icon={feature.icon} size={20} />
				</div>
				<CardTitle className="pt-3">{feature.title}</CardTitle>
				<CardDescription className="text-subtext0">{feature.description}</CardDescription>
			</CardHeader>
		</Card>
	);
}

function PricingTier({ tier }: { tier: PricingTierData }) {
	return (
		<Card className={cn("relative", tier.featured && "border-primary")}>
			{tier.featured && <Badge className="absolute right-6 top-6">Most popular</Badge>}
			<CardHeader>
				<CardTitle className="text-lg">{tier.name}</CardTitle>
				<CardDescription className="text-subtext0">{tier.description}</CardDescription>
				<div className="flex items-baseline gap-1 pt-2">
					<span className="text-3xl font-bold text-text">{tier.price}</span>
					<span className="text-sm text-subtext0">/month</span>
				</div>
			</CardHeader>
			<CardContent>
				<Button variant={tier.featured ? "default" : "outline"} className="w-full">
					Get started
				</Button>
			</CardContent>
			<CardFooter>
				<ul className="flex w-full flex-col gap-3">
					{tier.features.map((item) => (
						<li key={item} className="flex items-center gap-2 text-sm text-subtext">
							<Icon icon="mdi:check" size={16} className="shrink-0 text-success" />
							<span>{item}</span>
						</li>
					))}
				</ul>
			</CardFooter>
		</Card>
	);
}

export function MarketingScene() {
	return (
		<div className="-m-6 text-text">
			{/* 1. NAV */}
			<header className="flex h-14 items-center justify-between border-b border-border px-4">
				<div className="flex items-center gap-2">
					<Icon icon="mdi:weather-windy" size={22} className="text-primary" />
					<span className="font-semibold text-text">Acme Inc.</span>
				</div>
				<nav className="hidden items-center gap-6 md:flex">
					{navLinks.map((link) => (
						<NavLink key={link} label={link} />
					))}
				</nav>
				<div className="flex items-center gap-2">
					<Button variant="ghost" size="sm">
						Login
					</Button>
					<Button size="sm">Get started</Button>
				</div>
			</header>

			{/* 2. HERO */}
			<section className="py-20">
				<div className="mx-auto max-w-6xl px-4">
					<div className="flex flex-col items-center text-center">
						<Badge variant="secondary" className="gap-1">
							<Icon icon="mdi:star" size={12} />
							New features released
						</Badge>
						<h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight text-balance text-text md:text-5xl">
							Make Better Decisions, With Ease
						</h1>
						<p className="mx-auto mt-6 max-w-2xl text-lg text-subtext0">
							Acme Inc. turns scattered data into clear, confident decisions. Align your team, cut
							the guesswork, and ship the work that actually moves the needle.
						</p>
						<div className="mt-8 flex flex-wrap items-center justify-center gap-3">
							<Button size="lg">Get started</Button>
							<Button variant="outline" size="lg">
								<Icon icon="mdi:play-circle-outline" size={16} />
								Watch demo
							</Button>
						</div>
						<div className="mt-14 grid aspect-video w-full max-w-4xl place-items-center rounded-xl border border-border bg-surface">
							<Icon icon="mdi:play-circle-outline" size={56} className="text-subtext0" />
						</div>
					</div>
				</div>
			</section>

			{/* 3. LOGO CLOUD */}
			<section className="py-16">
				<div className="mx-auto max-w-6xl px-4">
					<p className="text-center text-sm text-subtext0">Trusted by leading companies</p>
					<div className="mt-8 flex flex-wrap items-center justify-center gap-8 opacity-70">
						{logoCloud.map((name) => (
							<div key={name} className="flex items-center gap-2 text-subtext0">
								<Icon icon="mdi:hexagon-outline" size={20} />
								<span className="text-sm font-medium">{name}</span>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* 4. FEATURES */}
			<section className="py-20">
				<div className="mx-auto max-w-6xl px-4">
					<div className="mx-auto max-w-2xl text-center">
						<h2 className="text-3xl font-bold tracking-tight text-text">AI That Works Your Way</h2>
						<p className="mt-4 text-subtext0">
							Powerful building blocks that adapt to how your team already works, no rip-and-replace
							required.
						</p>
					</div>
					<div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
						{features.map((feature) => (
							<Feature key={feature.id} feature={feature} />
						))}
					</div>
				</div>
			</section>

			{/* 5. STATS */}
			<section className="py-16">
				<div className="mx-auto max-w-6xl px-4">
					<div className="rounded-xl border border-border bg-base py-12">
						<div className="grid grid-cols-2 gap-8 md:grid-cols-4">
							{stats.map((stat) => (
								<div key={stat.id} className="text-center">
									<div className="text-3xl font-bold text-text">{stat.value}</div>
									<div className="mt-1 text-sm text-subtext0">{stat.label}</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* 6. PRICING */}
			<section className="py-20">
				<div className="mx-auto max-w-6xl px-4">
					<div className="mx-auto max-w-2xl text-center">
						<h2 className="text-3xl font-bold tracking-tight text-text">
							Simple Pricing, Smarter Work
						</h2>
						<p className="mt-4 text-subtext0">
							Start free, upgrade when you grow. Every plan includes the core platform and a 14-day
							trial.
						</p>
					</div>
					<div className="mt-12 grid gap-6 md:grid-cols-3">
						{pricingTiers.map((tier) => (
							<PricingTier key={tier.id} tier={tier} />
						))}
					</div>
				</div>
			</section>

			{/* 7. FAQ */}
			<section className="py-20">
				<div className="mx-auto max-w-6xl px-4">
					<div className="mx-auto max-w-3xl">
						<h2 className="text-center text-3xl font-bold tracking-tight text-text">
							Frequently Asked Questions
						</h2>
						<Accordion type="single" collapsible defaultValue="q1" className="mt-10 w-full">
							{faqs.map((faq) => (
								<AccordionItem key={faq.id} value={faq.id}>
									<AccordionTrigger className="text-base text-text">
										{faq.question}
									</AccordionTrigger>
									<AccordionContent className="text-subtext0">{faq.answer}</AccordionContent>
								</AccordionItem>
							))}
						</Accordion>
					</div>
				</div>
			</section>

			{/* 8. FOOTER */}
			<footer className="border-t border-border py-12">
				<div className="mx-auto max-w-6xl px-4">
					<div className="grid grid-cols-2 gap-8 md:grid-cols-4">
						{footerColumns.map((column) => (
							<div key={column.id} className="flex flex-col gap-3">
								<h3 className="text-sm font-medium text-text">{column.heading}</h3>
								<ul className="flex flex-col gap-2">
									{column.links.map((link) => (
										<li key={link}>
											<button
												type="button"
												className="text-sm text-subtext0 transition-colors hover:text-text"
											>
												{link}
											</button>
										</li>
									))}
								</ul>
							</div>
						))}
					</div>
					<Separator className="my-8" />
					<div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
						<div className="flex items-center gap-2">
							<Icon icon="mdi:weather-windy" size={18} className="text-primary" />
							<span className="text-sm font-semibold text-text">Acme Inc.</span>
						</div>
						<p className="text-xs text-subtext0">© 2026 Acme Inc. All rights reserved.</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
