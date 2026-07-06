import { Icon } from "@registry-ui/icon";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupAction,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarInput,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuBadge,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	SidebarProvider,
	SidebarSeparator,
} from "~/components/ui/sidebar";

export function SidebarDemo() {
	return (
		<div className="h-[32rem] w-72 overflow-hidden rounded-md border border-border">
			<SidebarProvider className="min-h-0!">
				<Sidebar collapsible="none">
					<SidebarHeader>
						<SidebarInput placeholder="Search the docs..." />
					</SidebarHeader>
					<SidebarContent>
						<SidebarGroup>
							<SidebarGroupLabel>Platform</SidebarGroupLabel>
							<SidebarGroupContent>
								<SidebarMenu>
									<SidebarMenuItem>
										<SidebarMenuButton isActive>
											<Icon icon="mdi:view-dashboard-outline" />
											<span>Playground</span>
										</SidebarMenuButton>
										<SidebarMenuSub>
											<SidebarMenuSubItem>
												<SidebarMenuSubButton
													render={
														<a href="#">
															<span>History</span>
														</a>
													}
												/>
											</SidebarMenuSubItem>
											<SidebarMenuSubItem>
												<SidebarMenuSubButton
													isActive
													render={
														<a href="#">
															<span>Starred</span>
														</a>
													}
												/>
											</SidebarMenuSubItem>
											<SidebarMenuSubItem>
												<SidebarMenuSubButton
													render={
														<a href="#">
															<span>Settings</span>
														</a>
													}
												/>
											</SidebarMenuSubItem>
										</SidebarMenuSub>
									</SidebarMenuItem>
									<SidebarMenuItem>
										<SidebarMenuButton>
											<Icon icon="mdi:robot-outline" />
											<span>Models</span>
										</SidebarMenuButton>
										<SidebarMenuAction>
											<Icon icon="mdi:dots-horizontal" />
											<span className="sr-only">More</span>
										</SidebarMenuAction>
									</SidebarMenuItem>
									<SidebarMenuItem>
										<SidebarMenuButton>
											<Icon icon="mdi:book-open-outline" />
											<span>Documentation</span>
										</SidebarMenuButton>
										<SidebarMenuBadge>24</SidebarMenuBadge>
									</SidebarMenuItem>
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>
						<SidebarSeparator />
						<SidebarGroup>
							<SidebarGroupLabel>Projects</SidebarGroupLabel>
							<SidebarGroupAction title="Add Project">
								<Icon icon="mdi:plus" /> <span className="sr-only">Add Project</span>
							</SidebarGroupAction>
							<SidebarGroupContent>
								<SidebarMenu>
									<SidebarMenuItem>
										<SidebarMenuButton
											render={
												<a href="#">
													<Icon icon="mdi:vector-square" />
													<span>Design Engineering</span>
												</a>
											}
										/>
									</SidebarMenuItem>
									<SidebarMenuItem>
										<SidebarMenuButton
											render={
												<a href="#">
													<Icon icon="mdi:chart-pie" />
													<span>Sales &amp; Marketing</span>
												</a>
											}
										/>
									</SidebarMenuItem>
									<SidebarMenuItem>
										<SidebarMenuButton
											render={
												<a href="#">
													<Icon icon="mdi:map-outline" />
													<span>Travel</span>
												</a>
											}
										/>
									</SidebarMenuItem>
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>
					</SidebarContent>
					<SidebarFooter>
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton>
									<Icon icon="mdi:account-circle-outline" />
									<span>Username</span>
									<Icon icon="mdi:chevron-up" className="ml-auto" />
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarFooter>
				</Sidebar>
			</SidebarProvider>
		</div>
	);
}
