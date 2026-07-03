import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSeparator,
	FieldSet,
} from "~/components/ui/field";
import { Input } from "~/components/ui/input";

export function FieldFieldset() {
	return (
		<FieldGroup className="w-full max-w-sm">
			<FieldSet>
				<FieldLegend>Address Information</FieldLegend>
				<FieldDescription>We need your address to deliver your order.</FieldDescription>
				<FieldGroup>
					<Field>
						<FieldLabel htmlFor="street">Street Address</FieldLabel>
						<Input id="street" type="text" placeholder="123 Main St" />
					</Field>
					<div className="grid grid-cols-2 gap-4">
						<Field>
							<FieldLabel htmlFor="city">City</FieldLabel>
							<Input id="city" type="text" placeholder="New York" />
						</Field>
						<Field>
							<FieldLabel htmlFor="zip">Postal Code</FieldLabel>
							<Input id="zip" type="text" placeholder="90502" />
							<FieldError>Invalid postal code format.</FieldError>
						</Field>
					</div>
				</FieldGroup>
			</FieldSet>
			<FieldSeparator>or</FieldSeparator>
			<FieldSet>
				<FieldLegend variant="label">Shipping Notes</FieldLegend>
				<FieldGroup>
					<Field>
						<FieldLabel htmlFor="notes">Additional Instructions</FieldLabel>
						<Input id="notes" type="text" placeholder="Leave at door" />
						<FieldDescription>Optional delivery instructions for your courier.</FieldDescription>
					</Field>
				</FieldGroup>
			</FieldSet>
		</FieldGroup>
	);
}
