<script>
	import { onMount, onDestroy } from 'svelte';
	import { recordings } from '$lib/stores.js';
	import { fade } from 'svelte/transition';

	const esp32Ip = '192.168.4.1';
	const MOCK_MODE = false;
	let sensorData = null;
	let error = null;
	let isLoading = true;
	let pollingInterval;
	let isSwitching = false;
	let trainsetNumber = '';
	let trainName = '';

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
			return;
		}
		try {
			const response = await fetch(`http://${esp32Ip}/data`);
			if (!response.ok) throw new Error('Network response was not OK');
			sensorData = await response.json();
			error = null;
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

	const recordData = async () => {
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
		await recordings.update((currentRecords) => [newRecord, ...currentRecords]);
	};

    const handleDelete = (timestamp) => {
        recordings.deleteRecording(timestamp);
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
		<div class="flex min-h-[20vh] items-center justify-center">
			<p class="text-lg text-gray-700">Connecting to ESP32...</p>
		</div>
	{:else if error}
		<div class="flex min-h-[20vh] items-center justify-center">
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
				</div>

				<div class="flex flex-col gap-6 lg:col-span-1">
					<div class="rounded-lg bg-white/60 p-6 shadow-sm">
						<h2 class="mb-4 text-lg font-bold text-gray-800">Sensor Mode</h2>
						{#if isSwitching}
							<div class="text-center text-gray-600">Switching...</div>
						{:else}
							<div class="grid grid-cols-2 gap-4">
								<button
									class="rounded-lg py-3 font-semibold transition-all active:scale-95"
									class:bg-blue-600={sensorData.mode === 'ntc'}
									class:text-white={sensorData.mode === 'ntc'}
									class:shadow-lg={sensorData.mode === 'ntc'}
									class:bg-white-80={sensorData.mode !== 'ntc'}
									class:text-gray-700={sensorData.mode !== 'ntc'}
									on:click={() => switchMode('ntc')}>NTC</button
								>
								<button
									class="rounded-lg py-3 font-semibold transition-all active:scale-95"
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
								class="w-full rounded-lg bg-green-600 p-3 font-semibold text-white shadow-sm transition-all hover:bg-green-700 disabled:bg-gray-400 active:scale-95"
								on:click={recordData}
								disabled={isSwitching}>Record</button
							>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<div class="container mx-auto p-4 sm:p-6">
    {#if $recordings && $recordings.length > 0}
        <div class="bg-white shadow-md rounded-lg overflow-x-auto">
            <table class="min-w-full leading-normal">
                <thead>
                    <tr class="bg-gray-200 text-gray-600 uppercase text-sm">
                        <th class="py-3 px-5 text-left">Timestamp</th>
                        <th class="py-3 px-5 text-left">No. Trainset</th>
                        <th class="py-3 px-5 text-left">Nama Kereta</th>
                        <th class="py-3 px-5 text-left">Sensor Mode</th>
                        <th class="py-3 px-5 text-right">Sensor Temp</th>
                        <th class="py-3 px-5 text-right">Pembanding</th>
                        <th class="py-3 px-5 text-right">Selisih</th>
                        <th class="py-3 px-5 text-center">Actions</th>
                    </tr>
                </thead>
                <tbody class="text-gray-700">
                    {#each $recordings as record (record.timestamp)}
                        <tr class="border-b border-gray-200 hover:bg-gray-50">
                            <td class="py-3 px-5 text-left whitespace-nowrap">{new Date(record.timestamp).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'medium' })}</td>
                            <td class="py-3 px-5 text-left">{record.trainset}</td>
                            <td class="py-3 px-5 text-left">{record.name}</td>
                            <td class="py-3 px-5 text-left">{record.mode.toUpperCase()}</td>
                            <td class="py-3 px-5 text-right font-mono">{record.sensorTemp.toFixed(2)} °C</td>
                            <td class="py-3 px-5 text-right font-mono">{record.hdcTemp.toFixed(2)} °C</td>
                            <td class="py-3 px-5 text-right font-mono font-semibold">{record.difference.toFixed(2)} °C</td>
                            <td class="py-3 px-5 text-center">
                                <button on:click={() => handleDelete(record.timestamp)} aria-label="Delete record" class="p-2 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 transition-all active:scale-90 active:bg-red-200">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd" />
                                    </svg>
                                </button>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>

    {:else}
        <div class="text-center py-12">
            <p class="text-gray-500 text-lg">No data has been recorded yet.</p>
        </div>
    {/if}
</div>