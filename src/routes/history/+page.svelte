<script>
    import { recordings } from '$lib/stores.js';
    import { Share } from '@capacitor/share';

    import { Capacitor } from '@capacitor/core';
    import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

    const exportToCSV = async () => {
        if (!$recordings || $recordings.length === 0) {
            alert('No data to export!');
            return;
        }

        // Create the CSV content as before
        const headers = ['Timestamp', 'No. Trainset', 'Nama Kereta', 'Sensor Mode', 'Sensor Temp (°C)', 'Pembanding (°C)', 'Selisih (°C)'];
        const rows = $recordings.map(rec => {
            const timestamp = new Date(rec.timestamp || Date.now());
            const datePart = timestamp.toLocaleDateString('id-ID');
            const timePart = timestamp.toLocaleTimeString('en-GB');
            const formattedTimestamp = `${datePart} ${timePart}`;
            return [
                formattedTimestamp,
                rec.trainset || '',
                rec.name || '',
                (rec.mode || '').toUpperCase(),
                (rec.sensorTemp || 0).toFixed(2),
                (rec.hdcTemp || 0).toFixed(2),
                (rec.difference || 0).toFixed(2)
            ].join(',');
        });
        const csvContent = [headers.join(','), ...rows].join('\n');

        // Check if the app is running on a native platform
        if (Capacitor.isNativePlatform()) {
            try {
                const date = new Date().toISOString().slice(0, 10);
                const trainsetNumber = $recordings[0]?.trainset || 'data';
                const fileName = `Traintemp_Export_${trainsetNumber}_${date}.csv`;

                // Use the Filesystem plugin to save the file
                const result = await Filesystem.writeFile({
                    path: fileName,
                    data: csvContent,
                    directory: Directory.Documents, // Saves to the app's private documents directory
                    encoding: Encoding.UTF8,
                });

                alert(`File saved successfully to your app's Documents folder!\nPath: ${result.uri}`);
                
                await Share.share({
                    title: fileName,
                    text: 'Traintemp Data Export',
                    url: result.uri,
                });

            } catch (e) {
                console.error('Unable to save file', e);
                alert(`Error saving file: ${e.message}`);
            }
        } else {
            // Fallback for web browsers
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `Traintemp_Export.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    };
    
    // ... other functions (handleDelete, handleClearAll) remain the same
</script>

<svelte:head>
    <title>Recording History</title>
</svelte:head>

<div class="container mx-auto p-4 sm:p-6">
    <div class="flex flex-col sm:flex-row justify-between sm:items-center mb-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">Recording History</h2>
        {#if $recordings.length > 0}
            <div class="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                 <button class="w-full sm:w-auto bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-red-700 transition-transform active:scale-95 flex items-center justify-center gap-2" on:click={handleClearAll}>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd" />
                    </svg>
                    Clear All
                </button>
                <button class="w-full sm:w-auto bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition-transform active:scale-95 flex items-center justify-center gap-2" on:click={exportToCSV}>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 9.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 7.414V13a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                    </svg>
                    Export to .csv
                </button>
            </div>
        {/if}
    </div>

    {#if $recordings && $recordings.length > 0}
        <div class="grid grid-cols-1 gap-4 lg:hidden">
            {#each $recordings as record (record.timestamp)}
                <div class="bg-white p-4 rounded-lg shadow flex gap-4 items-center">
                    <div class="flex-grow">
                        <div class="flex justify-between items-start">
                            <div>
                                <p class="font-bold text-gray-800">{record.name} ({record.trainset})</p>
                                <p class="text-sm text-gray-500">{new Date(record.timestamp).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'medium' })}</p>
                            </div>
                            <span class="text-sm font-semibold px-2 py-1 rounded-full"
                                  class:bg-blue-100={record.mode === 'ntc'}
                                  class:text-blue-800={record.mode === 'ntc'}
                                  class:bg-green-100={record.mode === 'pt1000'}
                                  class:text-green-800={record.mode === 'pt1000'}>
                                {record.mode.toUpperCase()}
                            </span>
                        </div>
                        <div class="mt-4 grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p class="text-sm text-gray-500">Sensor</p>
                                <p class="font-semibold text-lg text-gray-800">{record.sensorTemp.toFixed(2)} °C</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500">Pembanding</p>
                                <p class="font-semibold text-lg text-gray-800">{record.hdcTemp.toFixed(2)} °C</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500">Selisih</p>
                                <p class="font-bold text-lg text-indigo-600">{record.difference.toFixed(2)} °C</p>
                            </div>
                        </div>
                    </div>
                     <button on:click={() => handleDelete(record.timestamp)} aria-label="Delete record" class="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-600 transition-all active:scale-90 active:bg-red-200">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            {/each}
        </div>

        <div class="hidden lg:block bg-white shadow-md rounded-lg overflow-hidden">
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
            <a href="/" class="mt-4 inline-block bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition-colors active:scale-95">
                Go to Dashboard to Record Data
            </a>
        </div>
    {/if}
</div>