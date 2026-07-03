import * as React from "react";

import { Calendar } from "~/components/ui/calendar";

export function CalendarDemo() {
	const [date, setDate] = React.useState<Date | undefined>(new Date(2025, 5, 12));

	return (
		<Calendar
			mode="single"
			selected={date}
			onSelect={setDate}
			className="rounded-lg border"
			captionLayout="dropdown"
		/>
	);
}
