import { Kbd, KbdGroup } from "~/components/ui/kbd";

export function KbdDemo() {
	return (
		<KbdGroup>
			<Kbd>⌘</Kbd>
			<Kbd>⇧</Kbd>
			<Kbd>⌥</Kbd>
			<Kbd>⌃</Kbd>
		</KbdGroup>
	);
}
