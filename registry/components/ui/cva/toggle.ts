import { cva } from "class-variance-authority";

const toggle = cva(
	"group/toggle inline-flex items-center justify-center gap-1 rounded-md text-sm font-medium whitespace-nowrap transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 hover:bg-interactive/50 hover:text-primary focus-visible:bg-primary focus-visible:text-current aria-pressed:bg-primary aria-pressed:text-current",
	{
		variants: {
			variant: {
				default: "bg-transparent",
				outline: "border border-input bg-transparent shadow-xs hover:bg-interactive/50",
			},
			size: {
				default:
					"h-9 min-w-9 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
				sm: "h-8 min-w-8 px-2.5 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5",
				lg: "h-10 min-w-10 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
			},
		},
		defaultVariants: { variant: "default", size: "default" },
	},
);

export { toggle as toggleVariants };
