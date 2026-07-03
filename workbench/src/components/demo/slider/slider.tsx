import { Slider } from "~/components/ui/slider";

export function SliderDemo() {
	return <Slider defaultValue={[50]} max={100} step={1} className="mx-auto w-full max-w-xs" />;
}
