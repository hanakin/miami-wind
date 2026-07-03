"use client";

import { Menubar, MenubarMenu, MenubarTrigger } from "~/components/ui/menubar";

export function MenubarDemo() {
	return (
		<Menubar>
			<MenubarMenu>
				<MenubarTrigger>File</MenubarTrigger>
			</MenubarMenu>
			<MenubarMenu>
				<MenubarTrigger>Edit</MenubarTrigger>
			</MenubarMenu>
		</Menubar>
	);
}
