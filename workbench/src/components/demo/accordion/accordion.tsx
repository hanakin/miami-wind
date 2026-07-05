import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "~/components/ui/accordion";

export function AccordionDemo() {
	return (
		<Accordion defaultValue={["item-1"]} className="max-w-lg">
			<AccordionItem value="item-1">
				<AccordionTrigger>What are your shipping options?</AccordionTrigger>
				<AccordionContent>
					We offer standard (5-7 days), express (2-3 days), and overnight shipping. Free shipping on
					international orders.
				</AccordionContent>
			</AccordionItem>
			<AccordionItem value="item-2">
				<AccordionTrigger>What is your return policy?</AccordionTrigger>
				<AccordionContent>
					Returns accepted within 30 days. Items must be unused and in original packaging. Refunds
					processed within 5-7 business days.
				</AccordionContent>
			</AccordionItem>
			<AccordionItem value="item-3">
				<AccordionTrigger>How can I contact customer support?</AccordionTrigger>
				<AccordionContent>
					Reach us via email, live chat, or phone. We respond within 24 hours during business days.
				</AccordionContent>
			</AccordionItem>
		</Accordion>
	);
}
