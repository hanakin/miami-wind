import { cva } from "class-variance-authority";

const item = cva(
	"group/item flex flex-wrap items-center rounded-md border border-transparent text-sm transition-colors duration-100 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 [a]:transition-colors [a]:hover:bg-accent/50",
	{
		variants: {
			variant: {
				default: "bg-transparent",
				outline: "border-border",
				muted: "bg-muted",
			},
			size: {
				default: "gap-4 p-4",
				sm: "gap-2.5 px-4 py-3",
			},
		},
		defaultVariants: { variant: "default", size: "default" },
	},
);

export { item as itemVariants };
