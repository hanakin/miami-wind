import { Icon } from "@registry-ui/icon";

import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from "~/components/ui/avatar";

export function AvatarBadgeExample() {
	return (
		<div className="flex flex-wrap items-center gap-6">
			<Avatar>
				<AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
				<AvatarFallback>CN</AvatarFallback>
				<AvatarBadge className="bg-green-600 dark:bg-green-800" />
			</Avatar>
			<Avatar className="grayscale">
				<AvatarImage src="https://github.com/pranathip.png" alt="@pranathip" />
				<AvatarFallback>PP</AvatarFallback>
				<AvatarBadge>
					<Icon icon="mdi:plus" />
				</AvatarBadge>
			</Avatar>
		</div>
	);
}
