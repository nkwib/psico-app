<script lang="ts">
	import { Select } from "bits-ui";
	import { cn } from "$lib/utils";

	type $$Props = Select.ValueProps;

	let className: string | undefined | null = undefined;
	export { className as class };
</script>

<Select.Value class={cn("", className)} {...$$restProps} />