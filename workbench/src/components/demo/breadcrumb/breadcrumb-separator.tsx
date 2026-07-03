import { Icon } from "@registry-ui/icon";

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";

export function BreadcrumbSeparatorDemo() {
	return (
		<Breadcrumb>
			<BreadcrumbList>
				<BreadcrumbItem>
					<BreadcrumbLink asChild>
						<a href="/">Home</a>
					</BreadcrumbLink>
				</BreadcrumbItem>
				<BreadcrumbSeparator>
					<Icon icon="mdi:circle-small" />
				</BreadcrumbSeparator>
				<BreadcrumbItem>
					<BreadcrumbLink asChild>
						<a href="/components">Components</a>
					</BreadcrumbLink>
				</BreadcrumbItem>
				<BreadcrumbSeparator>
					<Icon icon="mdi:circle-small" />
				</BreadcrumbSeparator>
				<BreadcrumbItem>
					<BreadcrumbPage>Breadcrumb</BreadcrumbPage>
				</BreadcrumbItem>
			</BreadcrumbList>
		</Breadcrumb>
	);
}
