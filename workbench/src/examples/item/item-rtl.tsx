import { Icon } from "@registry-ui/icon";
import { Button } from "~/components/ui/button";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemMedia,
	ItemTitle,
} from "~/components/ui/item";

// ponytail: shadcn's RTL demo wires a language-selector + ui-rtl variants we don't ship;
// this shows the same items statically in Arabic with dir="rtl" using our components.
export function ItemRtl() {
	return (
		<div className="flex w-full max-w-md flex-col gap-6" dir="rtl">
			<Item variant="outline" dir="rtl">
				<ItemContent>
					<ItemTitle>عنصر أساسي</ItemTitle>
					<ItemDescription>عنصر بسيط يحتوي على عنوان ووصف.</ItemDescription>
				</ItemContent>
				<ItemActions>
					<Button variant="outline" size="sm">
						إجراء
					</Button>
				</ItemActions>
			</Item>
			<Item variant="outline" size="sm" asChild dir="rtl">
				<a href="#">
					<ItemMedia>
						<Icon icon="mdi:check-decagram-outline" className="size-5" />
					</ItemMedia>
					<ItemContent>
						<ItemTitle>تم التحقق من ملفك الشخصي.</ItemTitle>
					</ItemContent>
					<ItemActions>
						<Icon icon="mdi:chevron-right" className="size-4" />
					</ItemActions>
				</a>
			</Item>
		</div>
	);
}
