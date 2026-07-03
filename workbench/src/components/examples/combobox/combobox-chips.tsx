"use client";

import { useState } from "react";
import {
	Combobox,
	ComboboxChip,
	ComboboxChips,
	ComboboxChipsInput,
	ComboboxContent,
	ComboboxItem,
	ComboboxList,
	useComboboxAnchor,
} from "~/components/ui/combobox";

const fruits = ["Apple", "Banana", "Cherry", "Mango"];

export function ComboboxChipsOpen() {
	const anchor = useComboboxAnchor();
	const [value, setValue] = useState<string[]>(["Apple", "Banana"]);
	return (
		<div className="w-64">
			<Combobox items={fruits} multiple value={value} onValueChange={setValue}>
				<ComboboxChips ref={anchor}>
					{value.map((v) => (
						<ComboboxChip key={v}>{v}</ComboboxChip>
					))}
					<ComboboxChipsInput placeholder="Add fruit…" />
				</ComboboxChips>
				<ComboboxContent anchor={anchor.current}>
					<ComboboxList>
						{fruits.map((fruit) => (
							<ComboboxItem key={fruit} value={fruit}>
								{fruit}
							</ComboboxItem>
						))}
					</ComboboxList>
				</ComboboxContent>
			</Combobox>
		</div>
	);
}
