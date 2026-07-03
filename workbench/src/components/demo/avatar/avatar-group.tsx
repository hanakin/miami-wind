import { Icon } from "@registry-ui/icon";

import {
	Avatar,
	AvatarFallback,
	AvatarGroup,
	AvatarGroupCount,
	AvatarImage,
} from "~/components/ui/avatar";

export function AvatarGroupExample() {
	return (
		<div className="flex flex-wrap items-center gap-6">
			<AvatarGroup className="grayscale">
				<Avatar>
					<AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
					<AvatarFallback>CN</AvatarFallback>
				</Avatar>
				<Avatar>
					<AvatarImage src="https://github.com/maxleiter.png" alt="@maxleiter" />
					<AvatarFallback>LR</AvatarFallback>
				</Avatar>
				<Avatar>
					<AvatarFallback>ER</AvatarFallback>
				</Avatar>
				<AvatarGroupCount>+3</AvatarGroupCount>
			</AvatarGroup>
			<AvatarGroup className="grayscale">
				<Avatar>
					<AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
					<AvatarFallback>CN</AvatarFallback>
				</Avatar>
				<Avatar>
					<AvatarImage src="https://github.com/maxleiter.png" alt="@maxleiter" />
					<AvatarFallback>LR</AvatarFallback>
				</Avatar>
				<Avatar>
					<AvatarImage src="https://github.com/evilrabbit.png" alt="@evilrabbit" />
					<AvatarFallback>ER</AvatarFallback>
				</Avatar>
				<AvatarGroupCount>
					<Icon icon="mdi:plus" />
				</AvatarGroupCount>
			</AvatarGroup>
		</div>
	);
}
