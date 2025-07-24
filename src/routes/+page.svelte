<script>
	// Your entire <script> block remains exactly the same.
	import { onMount, onDestroy } from 'svelte';
	import { recordings } from '$lib/stores.js';
	import MinMax from '$lib/components/MinMax.svelte';
	import TemperatureChart from '$lib/components/TemperatureChart.svelte';
	import { fade } from 'svelte/transition';

	const esp32Ip = '192.168.4.1';
	const MOCK_MODE = true;
	const LIVE_DATA_HISTORY_LIMIT = 50;
	let sensorData = null;
	let error = null;
	let isLoading = true;
	let pollingInterval;
	let isSwitching = false;
	let trainsetNumber = '';
	let trainName = '';
	let liveDataHistory = [];
	const updateLiveDataHistory = () => {
		if (!sensorData) return;
		const newPoint = {
			timestamp: new Date(),
			sensorTemp: sensorData.sensor,
			hdcTemp: sensorData.hdc1080
		};
		const updatedHistory = [...liveDataHistory, newPoint];
		if (updatedHistory.length > LIVE_DATA_HISTORY_LIMIT) {
			updatedHistory.shift();
		}
		liveDataHistory = updatedHistory;
	};
	const fetchSensorData = async () => {
		if (MOCK_MODE) {
			if (!sensorData) {
				sensorData = { mode: 'ntc', sensor: 25.43, hdc1080: 25.11, selisih: 0.32 };
			}
			sensorData.sensor = parseFloat((sensorData.sensor + (Math.random() - 0.5) * 0.2).toFixed(2));
			sensorData.hdc1080 = parseFloat(
				(sensorData.hdc1080 + (Math.random() - 0.5) * 0.1).toFixed(2)
			);
			sensorData.selisih = parseFloat((sensorData.sensor - sensorData.hdc1080).toFixed(2));
			isLoading = false;
			error = null;
			updateLiveDataHistory();
			return;
		}
		try {
			const response = await fetch(`http://${esp32Ip}/data`);
			if (!response.ok) throw new Error('Network response was not OK');
			sensorData = await response.json();
			error = null;
			updateLiveDataHistory();
		} catch (err) {
			console.error('Fetch error:', err);
			error =
				"Could not connect to ESP32. Ensure you are connected to the 'Traintemp Difflogger' Wi-Fi.";
		} finally {
			isLoading = false;
		}
	};
	const switchMode = async (newMode) => {
		if (sensorData?.mode === newMode || isSwitching) return;
		isSwitching = true;
		liveDataHistory = [];
		if (MOCK_MODE) {
			setTimeout(() => {
				sensorData.mode = newMode;
				sensorData.sensor = newMode === 'pt1000' ? 24.88 : 25.43;
				fetchSensorData();
				isSwitching = false;
			}, 800);
			return;
		}
		try {
			const response = await fetch(`http://${esp32Ip}/switch?mode=${newMode}`);
			if (!response.ok) throw new Error('Failed to switch mode');
			await fetchSensorData();
		} catch (err) {
			console.error('Switch mode error:', err);
			error = 'Loading...';
		} finally {
			isSwitching = false;
		}
	};
	const recordData = () => {
		if (!sensorData || !trainsetNumber || !trainName) {
			alert('Please fill in both No. Trainset and Nama Kereta before recording.');
			return;
		}
		const newRecord = {
			timestamp: new Date(),
			trainset: trainsetNumber,
			name: trainName,
			mode: sensorData.mode,
			sensorTemp: sensorData.sensor,
			hdcTemp: sensorData.hdc1080,
			difference: sensorData.selisih
		};
		recordings.update((currentRecords) => [newRecord, ...currentRecords]);
	};
	onMount(() => {
		fetchSensorData();
		pollingInterval = setInterval(fetchSensorData, 2000);
	});
	onDestroy(() => {
		clearInterval(pollingInterval);
	});
</script>

<svelte:head>
	<title>Traintemp Dashboard</title>
</svelte:head>

<div
	class="rounded-xl border border-white/20 bg-white/50 p-2 shadow-lg shadow-black/5 backdrop-blur-lg sm:p-6"
>
	{#if isLoading}
		<div class="flex min-h-[60vh] items-center justify-center">
			<p class="text-lg text-gray-700">Connecting to ESP32...</p>
		</div>
	{:else if error}
		<div class="flex min-h-[60vh] items-center justify-center">
			<p class="text-lg font-semibold text-red-700">{error}</p>
		</div>
	{:else if sensorData}
		<div in:fade={{ duration: 300 }}>
			<div class="grid grid-cols-1 gap-6 lg:grid-cols-4">
				<div class="flex flex-col gap-6 lg:col-span-3">
					<div class="grid grid-cols-1 gap-6 sm:grid-cols-3" class:opacity-50={isSwitching}>
						<div class="rounded-lg bg-white/60 p-5 shadow-sm">
							<span class="font-semibold text-gray-600">Suhu {sensorData.mode.toUpperCase()}</span>
							<p class="mt-1 text-4xl font-bold text-gray-900">{sensorData.sensor.toFixed(2)} °C</p>
						</div>
						<div class="rounded-lg bg-white/60 p-5 shadow-sm">
							<span class="font-semibold text-gray-600">Suhu Pembanding</span>
							<p class="mt-1 text-4xl font-bold text-gray-900">
								{sensorData.hdc1080.toFixed(2)} °C
							</p>
						</div>
						<div class="rounded-lg bg-gray-800 p-5 text-white shadow-md">
							<span class="font-semibold text-gray-300">Selisih Suhu</span>
							<p class="mt-1 text-4xl font-bold">{sensorData.selisih.toFixed(2)} °C</p>
						</div>
					</div>

					<div class="min-h-[400px] h-full rounded-lg bg-white/60 p-4 shadow-sm sm:p-6">
						<TemperatureChart data={liveDataHistory} />
					</div>
				</div>

				<div class="flex flex-col gap-6 lg:col-span-1">
					<div class="rounded-lg bg-white/60 p-6 shadow-sm">
						<h2 class="mb-4 text-lg font-bold text-gray-800">Sensor Mode</h2>
						{#if isSwitching}
							<div class="text-center text-gray-600">Switching...</div>
						{:else}
							<div class="grid grid-cols-2 gap-4">
								<button
									class="rounded-lg py-3 font-semibold transition-all"
									class:bg-blue-600={sensorData.mode === 'ntc'}
									class:text-white={sensorData.mode === 'ntc'}
									class:shadow-lg={sensorData.mode === 'ntc'}
									class:bg-white-80={sensorData.mode !== 'ntc'}
									class:text-gray-700={sensorData.mode !== 'ntc'}
									on:click={() => switchMode('ntc')}>NTC</button
								>
								<button
									class="rounded-lg py-3 font-semibold transition-all"
									class:bg-blue-600={sensorData.mode === 'pt1000'}
									class:text-white={sensorData.mode === 'pt1000'}
									class:shadow-lg={sensorData.mode === 'pt1000'}
									class:bg-white-80={sensorData.mode !== 'pt1000'}
									class:text-gray-700={sensorData.mode !== 'pt1000'}
									on:click={() => switchMode('pt1000')}>PT1000</button
								>
							</div>
						{/if}
					</div>

					<div class="rounded-lg bg-white/60 p-6 shadow-sm">
						<h2 class="mb-4 text-lg font-bold text-gray-800">Record Data</h2>
						<div class="flex flex-col gap-4">
							<input
								type="text"
								placeholder="No. Trainset"
								bind:value={trainsetNumber}
								class="w-full rounded-lg border-none p-3 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-500"
							/>
							<input
								type="text"
								placeholder="Nama Kereta"
								bind:value={trainName}
								class="w-full rounded-lg border-none p-3 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-500"
							/>
							<button
								class="w-full rounded-lg bg-green-600 p-3 font-semibold text-white shadow-sm transition-colors hover:bg-green-700 disabled:bg-gray-400"
								on:click={recordData}
								disabled={isSwitching}>Record</button
							>
						</div>
					</div>

					<div class="rounded-lg bg-white/60 p-6 shadow-sm">
						<MinMax data={$recordings} />
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
