import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuIndicator,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
} from "~/components/ui/navigation-menu";

export function NavigationMenuIndicatorDemo() {
	return (
		<NavigationMenu defaultValue="item-overview">
			<NavigationMenuList>
				<NavigationMenuItem value="item-overview">
					<NavigationMenuTrigger>Overview</NavigationMenuTrigger>
					<NavigationMenuContent>
						<ul className="grid w-[300px] gap-2 p-2">
							<li>
								<NavigationMenuLink asChild>
									<a href="#">Getting Started</a>
								</NavigationMenuLink>
							</li>
							<li>
								<NavigationMenuLink asChild>
									<a href="#">Installation</a>
								</NavigationMenuLink>
							</li>
						</ul>
					</NavigationMenuContent>
				</NavigationMenuItem>
				<NavigationMenuIndicator />
			</NavigationMenuList>
		</NavigationMenu>
	);
}
