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
					<BreadcrumbLink render={<a href="/">Home</a>} />
				</BreadcrumbItem>
				<BreadcrumbSeparator>
					<Icon icon="mdi:circle-small" />
				</BreadcrumbSeparator>
				<BreadcrumbItem>
					<BreadcrumbLink render={<a href="/components">Components</a>} />
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
