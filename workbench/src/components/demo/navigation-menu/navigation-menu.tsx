import type * as React from "react";

import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
	navigationMenuTriggerStyle,
} from "~/components/ui/navigation-menu";

const components: { title: string; href: string; description: string }[] = [
	{
		title: "Alert Dialog",
		href: "#",
		description:
			"A modal dialog that interrupts the user with important content and expects a response.",
	},
	{
		title: "Hover Card",
		href: "#",
		description: "For sighted users to preview content available behind a link.",
	},
	{
		title: "Progress",
		href: "#",
		description:
			"Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.",
	},
	{
		title: "Scroll-area",
		href: "#",
		description: "Visually or semantically separates content.",
	},
	{
		title: "Tabs",
		href: "#",
		description:
			"A set of layered sections of content—known as tab panels—that are displayed one at a time.",
	},
	{
		title: "Tooltip",
		href: "#",
		description:
			"A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.",
	},
];

export function NavigationMenuDemo() {
	return (
		<NavigationMenu defaultValue="item-getting-started">
			<NavigationMenuList>
				<NavigationMenuItem value="item-getting-started">
					<NavigationMenuTrigger>Getting started</NavigationMenuTrigger>
					<NavigationMenuContent>
						<ul className="w-96">
							<ListItem href="#" title="Introduction">
								Re-usable components built with Tailwind CSS.
							</ListItem>
							<ListItem href="#" title="Installation">
								How to install dependencies and structure your app.
							</ListItem>
							<ListItem href="#" title="Typography">
								Styles for headings, paragraphs, lists...etc
							</ListItem>
						</ul>
					</NavigationMenuContent>
				</NavigationMenuItem>
				<NavigationMenuItem>
					<NavigationMenuTrigger>Components</NavigationMenuTrigger>
					<NavigationMenuContent>
						<ul className="grid w-[400px] gap-2 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
							{components.map((component) => (
								<ListItem key={component.title} title={component.title} href={component.href}>
									{component.description}
								</ListItem>
							))}
						</ul>
					</NavigationMenuContent>
				</NavigationMenuItem>
				<NavigationMenuItem>
					<NavigationMenuLink
						className={navigationMenuTriggerStyle()}
						render={<a href="#">Docs</a>}
					/>
				</NavigationMenuItem>
			</NavigationMenuList>
		</NavigationMenu>
	);
}

function ListItem({
	title,
	children,
	href,
	...props
}: React.ComponentPropsWithoutRef<"li"> & { href: string }) {
	return (
		<li {...props}>
			<NavigationMenuLink
				render={
					<a href={href}>
						<div className="flex flex-col gap-1 text-sm">
							<div className="leading-none font-medium">{title}</div>
							<div className="line-clamp-2 text-muted-foreground">{children}</div>
						</div>
					</a>
				}
			/>
		</li>
	);
}
