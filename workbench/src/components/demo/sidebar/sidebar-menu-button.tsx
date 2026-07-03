import { Icon } from "@registry-ui/icon";
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

export function SidebarMenuButtonDemo() {
	return (
		<div className="h-72 w-72 overflow-hidden rounded-md border border-border">
			<SidebarProvider className="min-h-0!">
				<Sidebar collapsible="none">
					<SidebarContent>
						<SidebarGroup>
							<SidebarGroupLabel>Menu button</SidebarGroupLabel>
							<SidebarGroupContent>
								<SidebarMenu>
									<SidebarMenuItem>
										<SidebarMenuButton variant="outline">
											<Icon icon="mdi:shield-outline" />
											<span>Outline</span>
										</SidebarMenuButton>
									</SidebarMenuItem>
									<SidebarMenuItem>
										<SidebarMenuButton size="sm">
											<Icon icon="mdi:format-size" />
											<span>Small</span>
										</SidebarMenuButton>
									</SidebarMenuItem>
									<SidebarMenuItem>
										<SidebarMenuButton size="lg">
											<Icon icon="mdi:format-size" />
											<span>Large</span>
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
