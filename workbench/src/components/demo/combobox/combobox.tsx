"use client";

import {
	Combobox,
	ComboboxContent,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "~/components/ui/combobox";

const fruits = ["Apple", "Banana", "Cherry"];

export function ComboboxDemo() {
	return (
		<Combobox items={fruits}>
			<ComboboxInput placeholder="Pick a fruit…" />
			<ComboboxContent>
				<ComboboxList>
					{fruits.map((fruit) => (
						<ComboboxItem key={fruit} value={fruit}>
							{fruit}
						</ComboboxItem>
					))}
				</ComboboxList>
			</ComboboxContent>
		</Combobox>
	);
}
