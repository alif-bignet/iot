<script>
	/** @type {import('../stores').Recording[]} */
	export let data = [];

	// Reactive statements to calculate min and max temps whenever data changes
	$: minTemp = data.length > 0 ? Math.min(...data.map((r) => r.difference)) : null;
	$: maxTemp = data.length > 0 ? Math.max(...data.map((r) => r.difference)) : null;
</script>

<h2 class="text-lg font-semibold text-trisakti-blue mb-4">Recorded Stats</h2>
<div class="grid grid-cols-2 gap-4">
	<div class="bg-gray-100 p-4 rounded-md text-center">
		<span class="text-sm font-medium text-gray-500">Selisih Terendah</span>
		<p class="text-2xl font-semibold text-gray-800 mt-1">
			{minTemp !== null ? `${minTemp.toFixed(2)} °C` : 'N/A'}
		</p>
	</div>
	<div class="bg-gray-100 p-4 rounded-md text-center">
		<span class="text-sm font-medium text-gray-500">Selisih Tertinggi</span>
		<p class="text-2xl font-semibold text-gray-800 mt-1">
			{maxTemp !== null ? `${maxTemp.toFixed(2)} °C` : 'N/A'}
		</p>
	</div>
</div>

<style>
        @reference "tailwindcss";

</style>