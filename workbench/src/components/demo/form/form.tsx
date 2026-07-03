"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "~/components/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";

const formSchema = z.object({
	username: z
		.string()
		.min(2, "Username must be at least 2 characters.")
		.max(30, "Username must be at most 30 characters."),
});

export function FormDemo() {
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			username: "x",
		},
		mode: "all",
	});

	React.useEffect(() => {
		form.trigger();
	}, [form]);

	function onSubmit(data: z.infer<typeof formSchema>) {
		console.log(data);
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="w-2/3 space-y-6">
				<FormField
					control={form.control}
					name="username"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Username</FormLabel>
							<FormControl>
								<Input placeholder="shadcn" {...field} />
							</FormControl>
							<FormDescription>This is your public display name.</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button type="submit">Submit</Button>
			</form>
		</Form>
	);
}
