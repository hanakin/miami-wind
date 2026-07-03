import { Icon } from "@registry-ui/icon";

import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";

export function AlertDemo() {
	return (
		<div className="grid w-full max-w-md items-start gap-4">
			<Alert>
				<Icon icon="mdi:check-circle" />
				<AlertTitle>Payment successful</AlertTitle>
				<AlertDescription>
					Your payment of $29.99 has been processed. A receipt has been sent to your email address.
				</AlertDescription>
			</Alert>
		</div>
	);
}
