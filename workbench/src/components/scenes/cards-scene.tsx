import { Icon } from "@registry-ui/icon";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
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
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { Switch } from "~/components/ui/switch";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/utils/cn";

const teamMembers = [
	{ name: "Sofia Davis", email: "sofia.davis@miami.dev", initials: "SD", role: "owner" },
	{ name: "Jackson Lee", email: "jackson.lee@miami.dev", initials: "JL", role: "developer" },
	{ name: "Isabella Nguyen", email: "isabella.n@miami.dev", initials: "IN", role: "billing" },
];

const cookieSettings = [
	{
		id: "strictly-necessary",
		label: "Strictly Necessary",
		description: "These cookies are essential in order to use the website.",
		checked: true,
	},
	{
		id: "functional",
		label: "Functional Cookies",
		description: "These cookies allow the website to provide personalized features.",
		checked: true,
	},
	{
		id: "performance",
		label: "Performance Cookies",
		description: "These cookies help to improve the performance of the website.",
		checked: false,
	},
];

const payments = [
	{ id: "INV-001", status: "Success", email: "ken99@yahoo.com", amount: "$316.00" },
	{ id: "INV-002", status: "Processing", email: "abe45@gmail.com", amount: "$242.00" },
	{ id: "INV-003", status: "Failed", email: "monserrat44@proton.me", amount: "$837.00" },
	{ id: "INV-004", status: "Success", email: "silas22@icloud.com", amount: "$721.00" },
	{ id: "INV-005", status: "Pending", email: "carmella@hotmail.com", amount: "$458.00" },
] as const;

const plans = [
	{ id: "starter", name: "Starter Plan", description: "Perfect for small teams getting started." },
	{ id: "pro", name: "Pro Plan", description: "Advanced features for growing organizations." },
];

function statusVariant(status: (typeof payments)[number]["status"]) {
	if (status === "Failed") return "destructive" as const;
	if (status === "Success") return "default" as const;
	return "outline" as const;
}

export function CardsScene() {
	return (
		<div className="mx-auto max-w-6xl">
			<div className="columns-1 gap-4 md:columns-2 lg:columns-3 [&>*]:mb-4 [&>*]:break-inside-avoid">
				<Card>
					<CardHeader>
						<CardTitle>Create an account</CardTitle>
						<CardDescription>Enter your email below to create your account.</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-4">
						<div className="grid grid-cols-2 gap-4">
							<Button variant="outline">
								<Icon icon="mdi:github" size={16} /> GitHub
							</Button>
							<Button variant="outline">
								<Icon icon="mdi:google" size={16} /> Google
							</Button>
						</div>
						<div className="flex items-center gap-3">
							<Separator className="flex-1" />
							<span className="text-xs uppercase tracking-wide text-subtext0">
								Or continue with
							</span>
							<Separator className="flex-1" />
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor="create-email">Email</Label>
							<Input id="create-email" type="email" placeholder="you@miami.dev" />
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor="create-password">Password</Label>
							<Input id="create-password" type="password" placeholder="••••••••" />
						</div>
					</CardContent>
					<CardFooter>
						<Button className="w-full">Create account</Button>
					</CardFooter>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Team members</CardTitle>
						<CardDescription>Invite your team members to collaborate.</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-6">
						{teamMembers.map((member) => (
							<div key={member.email} className="flex items-center justify-between gap-4">
								<div className="flex items-center gap-3">
									<Avatar>
										<AvatarFallback>{member.initials}</AvatarFallback>
									</Avatar>
									<div className="flex flex-col">
										<span className="text-sm font-medium text-text">{member.name}</span>
										<span className="text-xs text-subtext0">{member.email}</span>
									</div>
								</div>
								<Select defaultValue={member.role}>
									<SelectTrigger className="w-32">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="owner">Owner</SelectItem>
										<SelectItem value="developer">Developer</SelectItem>
										<SelectItem value="billing">Billing</SelectItem>
									</SelectContent>
								</Select>
							</div>
						))}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Cookie Settings</CardTitle>
						<CardDescription>Manage your cookie settings here.</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-6">
						{cookieSettings.map((setting) => (
							<div key={setting.id} className="flex items-start justify-between gap-4">
								<div className="flex flex-col gap-1">
									<Label htmlFor={setting.id} className="font-semibold">
										{setting.label}
									</Label>
									<p className="text-xs text-subtext0">{setting.description}</p>
								</div>
								<Switch id={setting.id} defaultChecked={setting.checked} />
							</div>
						))}
					</CardContent>
					<CardFooter>
						<Button variant="outline" className="w-full">
							Save preferences
						</Button>
					</CardFooter>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Payments</CardTitle>
						<CardDescription>Recent transactions from your store.</CardDescription>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Status</TableHead>
									<TableHead>Email</TableHead>
									<TableHead className="text-right">Amount</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{payments.map((payment) => (
									<TableRow key={payment.id}>
										<TableCell>
											<Badge variant={statusVariant(payment.status)}>{payment.status}</Badge>
										</TableCell>
										<TableCell className="text-subtext0">{payment.email}</TableCell>
										<TableCell className="text-right tabular-nums">{payment.amount}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Report an issue</CardTitle>
						<CardDescription>What area are you having problems with?</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="flex flex-col gap-2">
								<Label htmlFor="issue-area">Area</Label>
								<Select defaultValue="billing">
									<SelectTrigger id="issue-area">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="billing">Billing</SelectItem>
										<SelectItem value="team">Team</SelectItem>
										<SelectItem value="account">Account</SelectItem>
										<SelectItem value="deployments">Deployments</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="flex flex-col gap-2">
								<Label htmlFor="issue-security">Security Level</Label>
								<Select defaultValue="2">
									<SelectTrigger id="issue-security">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="1">Severity 1</SelectItem>
										<SelectItem value="2">Severity 2</SelectItem>
										<SelectItem value="3">Severity 3</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor="issue-subject">Subject</Label>
							<Input id="issue-subject" placeholder="I need help with my invoice" />
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor="issue-description">Description</Label>
							<Textarea
								id="issue-description"
								placeholder="Please include all information relevant to your issue."
							/>
						</div>
					</CardContent>
					<CardFooter className="justify-between">
						<Button variant="ghost">Cancel</Button>
						<Button>Submit</Button>
					</CardFooter>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Upgrade your subscription</CardTitle>
						<CardDescription>Choose the plan that fits your team.</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="flex flex-col gap-2">
								<Label htmlFor="upgrade-name">Name</Label>
								<Input id="upgrade-name" placeholder="Evil Rabbit" />
							</div>
							<div className="flex flex-col gap-2">
								<Label htmlFor="upgrade-email">Email</Label>
								<Input id="upgrade-email" type="email" placeholder="evil@miami.dev" />
							</div>
						</div>
						<RadioGroup defaultValue="pro" className="flex flex-col gap-3">
							{plans.map((plan) => (
								<Label
									key={plan.id}
									htmlFor={`plan-${plan.id}`}
									className={cn(
										"flex cursor-pointer items-start gap-3 rounded-md border border-border bg-card p-4",
									)}
								>
									<RadioGroupItem id={`plan-${plan.id}`} value={plan.id} className="mt-0.5" />
									<div className="flex flex-col gap-1">
										<span className="text-sm font-medium text-text">{plan.name}</span>
										<span className="text-xs text-subtext0">{plan.description}</span>
									</div>
								</Label>
							))}
						</RadioGroup>
						<div className="flex items-center gap-2">
							<Checkbox id="upgrade-terms" />
							<Label htmlFor="upgrade-terms" className="text-sm text-subtext0">
								I agree to the terms and conditions
							</Label>
						</div>
					</CardContent>
					<CardFooter className="justify-between">
						<Button variant="ghost">Cancel</Button>
						<Button>Upgrade Plan</Button>
					</CardFooter>
				</Card>
			</div>
		</div>
	);
}
