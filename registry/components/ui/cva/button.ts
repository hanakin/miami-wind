import { cva } from "class-variance-authority";

const button = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 cursor-pointer",
	{
		variants: {
			variant: {
				default:
					"bg-primary text-primary-foreground hover:bg-[var(--color-pink-500)] focus-visible:bg-[var(--color-pink-500)] active:brightness-95",
				secondary:
					"bg-secondary text-secondary-foreground hover:bg-[var(--color-sky-400)] focus-visible:bg-[var(--color-sky-400)] active:brightness-95",
				destructive:
					"bg-destructive text-destructive-foreground focus-visible:bg-[var(--color-rose-500)] active:brightness-95 hover:bg-red",
				outline:
					"border border-input bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent active:brightness-95 hover:text-primary",
				ghost:
					"bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent hover:text-primary",
				link: "bg-transparent text-[var(--color-sky-400)] underline-offset-4 hover:underline focus-visible:underline hover:text-secondary",
			},
			size: {
				default: "h-9 px-4 py-2",
				sm: "h-8 px-3 text-xs",
				lg: "h-10 px-6",
				icon: "size-9",
			},
		},
		defaultVariants: { variant: "default", size: "default" },
	},
);

export { button as buttonVariants };
