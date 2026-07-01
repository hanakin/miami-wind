import { cva } from "class-variance-authority";

const badge = cva(
	"inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3",
	{
		variants: {
			variant: {
				secondary: "bg-secondary text-secondary-foreground",
				destructive:
					"bg-destructive text-white",
				outline:
					"border-border text-foreground",
			},
		},
	},
);

export { badge as badgeVariants };
