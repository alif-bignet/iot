<script>
	import { onDestroy, onMount } from 'svelte';
	import { recordings } from '$lib/stores.js';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import '../app.css';

	// --- TIMER LOGIC ---
	let elapsedTime = 0;
	let isTimerRunning = false;
	let timerInterval;
	let startTime;

	// Helper function to navigate, now used by buttons
	function navigate(path) {
		goto(path);
	}

	// Helper function to format ms into HH:MM:SS.ms
	function formatTime(ms) {
		const totalSeconds = Math.floor(ms / 1000);
		const hours = Math.floor(totalSeconds / 3600);
		const minutes = Math.floor((totalSeconds % 3600) / 60);
		const seconds = totalSeconds % 60;
		const milliseconds = ms % 1000;

		return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(
			seconds
		).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
	}

	// Reactive variable for the formatted time
	$: formattedTime = formatTime(elapsedTime);

	function toggleTimer() {
		if (isTimerRunning) {
			isTimerRunning = false;
			clearInterval(timerInterval);
		} else {
			isTimerRunning = true;
			startTime = Date.now() - elapsedTime;
			timerInterval = setInterval(() => {
				elapsedTime = Date.now() - startTime;
			}, 67);
		}
	}

	function resetTimer() {
		isTimerRunning = false;
		clearInterval(timerInterval);
		elapsedTime = 0;
	}

	onMount(async () => {
		// Initialize the database store on the client
		await recordings.init();
	});

	onDestroy(() => {
		if (timerInterval) clearInterval(timerInterval);
	});
</script>

<div class="fixed inset-0 -z-20 h-full w-full bg-gray-50">
	<div
		class="absolute bottom-[-20%] left-[-20%] h-2/3 w-2/3 rounded-full bg-gradient-to-r from-blue-200 via-blue-100 to-transparent opacity-50 blur-3xl"
	></div>
	<div
		class="absolute right-[-20%] top-[-20%] h-2/3 w-2/3 rounded-full bg-gradient-to-l from-pink-200 via-purple-100 to-transparent opacity-40 blur-3xl"
	></div>
</div>

<header
	class="sticky top-4 z-50 mx-auto max-w-7xl rounded-xl border border-white/30 bg-white/70 px-4 py-3 shadow-lg shadow-black/5 backdrop-blur-xl sm:px-6 lg:px-8 pt-[5px]"
>
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<img src="/favicon.svg" alt="Trisakti Logo" class="h-11 w-auto" />
			<div class="hidden sm:block">
				<h1 class="font-bold text-gray-900">Traintemp Difflogger</h1>
				<p class="text-xs text-gray-600">2025 Temperature Monitoring System By Anastasya Nisfi S</p>
			</div>
		</div>

		<nav class="hidden items-center gap-2 md:flex">
			<button
				on:click={() => navigate('/')}
				class="rounded-lg px-4 py-2 font-semibold text-gray-700 hover:bg-white/60"
			>
				Dashboard
			</button>
			<button
				on:click={() => navigate('/history')}
				class="rounded-lg px-4 py-2 font-semibold text-gray-700 hover:bg-white/60"
			>
				History
			</button>
		</nav>

		<div class="flex items-center gap-3">
			{#if browser}
				<div class="flex items-center gap-1 rounded-lg bg-white/60 p-1 shadow-inner">
					<span class="hidden select-none px-3 font-mono text-sm font-semibold text-gray-800 sm:block"
						>{formattedTime.slice(0, 8)}<span class="text-gray-400"
							>{formattedTime.slice(8)}</span
						></span
					>
					<button
						on:click={toggleTimer}
						aria-label={isTimerRunning ? 'Pause timer' : 'Start timer'}
						class="flex h-8 w-8 items-center justify-center rounded-md text-gray-600 transition-colors hover:bg-gray-200/60"
					>
						{#if isTimerRunning}
							<svg class="h-5 w-5 animate-pulse text-blue-600" viewBox="0 0 24 24" fill="currentColor"
								><path
									d="M6.25 5C5.56 5 5 5.56 5 6.25v11.5c0 .69.56 1.25 1.25 1.25h2.5c.69 0 1.25-.56 1.25-1.25V6.25C10 5.56 9.44 5 8.75 5h-2.5zM15.25 5c-.69 0-1.25.56-1.25 1.25v11.5c0 .69.56 1.25 1.25 1.25h2.5c.69 0 1.25-.56 1.25-1.25V6.25c0-.69-.56-1.25-1.25-1.25h-2.5z"
								/></svg
							>
						{:else}
							<svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"
								><path d="M8 5.14v14l11-7-11-7z" /></svg
							>
						{/if}
					</button>
					<button
						on:click={resetTimer}
						aria-label="Reset timer"
						class="flex h-8 w-8 items-center justify-center rounded-md text-gray-600 transition-colors hover:bg-gray-200/60"
					>
						<svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"
							><path
								d="M12 4C7.58 4 4 7.58 4 12s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14c-2.21 0-4-1.79-4-4s1.79-4 4-4v2.5l3.5-3.5L12 5V7.5c-3.04 0-5.5 2.46-5.5 5.5s2.46 5.5 5.5 5.5 5.5-2.46 5.5-5.5H15c0 1.65-1.35 3-3 3z"
							/></svg
						>
					</button>
				</div>
			{/if}
		</div>
	</div>
</header>

<main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<slot />
</main>

{#if browser}
	<div
		class="fixed bottom-1 left-1/2 z-50 -translate-x-1/2 rounded-full border border-white/30 bg-gray-900/60 px-6 py-3 text-white shadow-lg backdrop-blur-lg sm:hidden"
	>
		<span class="font-mono text-xl tracking-wider"
			>{formattedTime.slice(0, 8)}<span class="text-lg text-gray-400"
				>{formattedTime.slice(8)}</span
			></span
		>
	</div>
{/if}