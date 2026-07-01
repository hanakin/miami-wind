import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { themeStore } from "~/stores/theme";
import { client } from "~/utils/api";
import type { ThemeModel, ThemeToken } from "../../server/lib/theme-codec";

export function useThemeData() {
	const query = useQuery({
		queryKey: ["theme"],
		queryFn: async () => client.api.theme.$get().then((r) => r.json()),
	});
	const model = query.data;
	useEffect(() => {
		if (model) themeStore.getState().loadSaved(model.tokens as ThemeToken[], model.customCss ?? "");
	}, [model]);
	return query;
}

export function useSaveTheme() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (model: ThemeModel) => {
			const res = await client.api.theme.$put({ json: model });
			if (!res.ok) throw new Error(`Save failed (${res.status})`);
			return res.json();
		},
		onSuccess: () => {
			themeStore.getState().markSaved();
			qc.invalidateQueries({ queryKey: ["tailwind-classes"] });
			qc.invalidateQueries({ queryKey: ["theme"] });
		},
	});
}
