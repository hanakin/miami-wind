// @vitest-environment jsdom
import { Icon } from "@registry-ui/icon";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

afterEach(cleanup);

// Guards against a duplicate React instance: the registry's icon.tsx resolves react/iconify from
// outside this package, so without resolve.dedupe it pulls a second React and hooks crash with
// "Cannot read properties of null (reading 'useState')". Rendering it here exercises that path.
describe("render smoke", () => {
	it("renders the registry Icon (custom primitive) without a hook-dispatcher crash", () => {
		expect(() => render(<Icon icon="mdi:home" size={24} />)).not.toThrow();
	});
});
