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
								<NavigationMenuLink render={<a href="#">Getting Started</a>} />
							</li>
							<li>
								<NavigationMenuLink render={<a href="#">Installation</a>} />
							</li>
						</ul>
					</NavigationMenuContent>
					<NavigationMenuIndicator />
				</NavigationMenuItem>
			</NavigationMenuList>
		</NavigationMenu>
	);
}
