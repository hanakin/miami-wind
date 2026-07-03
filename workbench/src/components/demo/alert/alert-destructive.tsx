import { Icon } from "@registry-ui/icon";

import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";

export function AlertDestructive() {
	return (
		<Alert variant="destructive" className="max-w-md">
			<Icon icon="mdi:alert-circle" />
			<AlertTitle>Payment failed</AlertTitle>
			<AlertDescription>
				Your payment could not be processed. Please check your payment method and try again.
			</AlertDescription>
		</Alert>
	);
}
