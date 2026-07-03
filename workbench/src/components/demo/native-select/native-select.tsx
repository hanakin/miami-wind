import {
	NativeSelect,
	NativeSelectOptGroup,
	NativeSelectOption,
} from "~/components/ui/native-select";

export function NativeSelectDemo() {
	return (
		<NativeSelect>
			<NativeSelectOption value="">Select department</NativeSelectOption>
			<NativeSelectOptGroup label="Engineering">
				<NativeSelectOption value="frontend">Frontend</NativeSelectOption>
				<NativeSelectOption value="backend">Backend</NativeSelectOption>
				<NativeSelectOption value="devops">DevOps</NativeSelectOption>
			</NativeSelectOptGroup>
			<NativeSelectOptGroup label="Design">
				<NativeSelectOption value="product">Product</NativeSelectOption>
				<NativeSelectOption value="brand">Brand</NativeSelectOption>
			</NativeSelectOptGroup>
		</NativeSelect>
	);
}
