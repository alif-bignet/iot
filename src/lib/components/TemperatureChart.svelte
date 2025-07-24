<script>
	import { onMount, onDestroy } from 'svelte';
	import { Chart } from 'chart.js/auto';

	/** @type {import('../stores').Recording[]} */
	export let data = [];

	let canvasElement;
	let chart;
	let windowWidth = 0;

	// Filter data for mobile screens to prevent clutter
	$: displayData =
		windowWidth < 768 ? data.filter((_, i) => i % (data.length > 25 ? 2 : 1) === 0) : data;

	function updateChartData() {
		if (!chart) return;

		const reversedData = displayData.slice().reverse();

		chart.data.labels = reversedData.map((rec) => rec.timestamp.toLocaleTimeString('en-GB'));
		chart.data.datasets[0].data = reversedData.map((rec) => rec.sensorTemp);
		chart.data.datasets[1].data = reversedData.map((rec) => rec.hdcTemp);

		chart.update();
	}

	$: if (displayData && chart) {
		updateChartData();
	}

	onMount(() => {
		const chartData = {
			labels: [], // Initially empty
			datasets: [
				{
					label: 'Suhu Sensor (°C)',
					data: [], // Initially empty
					borderColor: '#1d4ed8',
					backgroundColor: '#1d4ed8',
					borderWidth: 2,
					pointRadius: 2,
					tension: 0.3
				},
				{
					label: 'Suhu Pembanding (°C)',
					data: [], // Initially empty
					borderColor: '#be123c',
					backgroundColor: '#be123c',
					borderWidth: 2,
					pointRadius: 2,
					tension: 0.3
				}
			]
		};

		const chartOptions = {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: {
					position: 'bottom',
					labels: { padding: 20, font: { size: 11 } }
				},
				title: { display: true, text: 'Grafik Tren Suhu' }
			},
			scales: {
				x: {
					ticks: {
						autoSkip: true,
						maxRotation: 45,
						minRotation: 20,
						padding: 5,
						font: { size: 10 }
					}
				},
				y: {
					ticks: {
						callback: (value) => {
							if (typeof value === 'number') {
								return value.toFixed(1) + ' °C';
							}
							return value;
						},
						font: { size: 10 }
					}
				}
			}
		};

		chart = new Chart(canvasElement, {
			type: 'line',
			data: chartData,
			options: chartOptions
		});

		if (data.length > 0) {
			updateChartData();
		}
	});

	onDestroy(() => {
		if (chart) {
			chart.destroy();
		}
	});
</script>

<svelte:window bind:innerWidth={windowWidth} />

<div class="relative h-full w-full">
	<canvas bind:this={canvasElement}></canvas>
	{#if data.length === 0}
		<div class="absolute inset-0 flex items-center justify-center pb-8">
			<p class="text-center text-gray-500">Waiting for sensor data...</p>
		</div>
	{/if}
</div>