import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";

// Checked instance so the `checkbox-indicator` slot (Radix mounts it only when checked) renders live.
export function CheckboxChecked() {
	return (
		<div className="flex items-center gap-3">
			<Checkbox id="terms-checked" defaultChecked />
			<Label htmlFor="terms-checked">Accept terms and conditions</Label>
		</div>
	);
}
