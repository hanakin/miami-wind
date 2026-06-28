import { Icon as Iconify } from "@iconify/react"
import type { ComponentType, SVGProps } from "react"

type IconProps = { size?: number; className?: string } & (
	| { type?: "iconify"; icon: string }
	| { type: "custom"; icon: ComponentType<SVGProps<SVGSVGElement>> }
)

// <Icon icon="mdi:add" />            iconify name (prefer mdi: per DESIGN.md, any set allowed)
// <Icon icon="lucide:home" size={24} />
// <Icon type="custom" icon={ChargerSvg} />   your SVG component, themed via currentColor
export function Icon(props: IconProps) {
	const { size = 20, className } = props
	if (props.type === "custom") {
		const Svg = props.icon
		return <Svg width={size} height={size} className={className} />
	}
	return <Iconify icon={props.icon} width={size} height={size} className={className} />
}
