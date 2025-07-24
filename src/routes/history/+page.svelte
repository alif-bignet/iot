<script>
    import { recordings } from '$lib/stores.js'; // Import the shared store

    // This function is identical to your original, but uses $recordings
    const exportToCSV = () => {
        if ($recordings.length === 0) {
            alert('No data to export!');
            return;
        }

        const headers = ['Timestamp', 'No. Trainset', 'Nama Kereta', 'Sensor Mode', 'Sensor Temp (°C)', 'Pembanding (°C)', 'Selisih (°C)'];
        const rows = $recordings.map(rec => {
            const datePart = rec.timestamp.toLocaleDateString('id-ID');
            const timePart = rec.timestamp.toLocaleTimeString('en-GB');
            const formattedTimestamp = `${datePart} ${timePart}`;

            return [
                formattedTimestamp,
                rec.trainset,
                rec.name,
                rec.mode.toUpperCase(),
                rec.sensorTemp.toFixed(2),
                rec.hdcTemp.toFixed(2),
                rec.difference.toFixed(2)
            ].join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        const date = new Date().toISOString().slice(0, 10);
        // Assumes at least one record exists to get trainsetNumber
        const trainsetNumber = $recordings[0]?.trainset || 'data';
        link.setAttribute('href', url);
        link.setAttribute('download', `Traintemp_Export_${trainsetNumber}_${date}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
</script>

<svelte:head>
    <title>Recording History</title>
</svelte:head>

<div class="history-header">
    <h2>Recording History</h2>
    {#if $recordings.length > 0}
        <button class="export-btn" on:click={exportToCSV}>
            📥 Export to Excel (.csv)
        </button>
    {/if}
</div>

{#if $recordings.length > 0}
    <div class="table-container">
        <table>
            <thead>
                <tr>
                    <th>Timestamp</th>
                    <th>No. Trainset</th>
                    <th>Nama Kereta</th>
                    <th>Sensor Mode</th>
                    <th>Sensor Temp</th>
                    <th>Pembanding</th>
                    <th>Selisih</th>
                </tr>
            </thead>
            <tbody>
                {#each $recordings as record}
                    <tr>
                        <td>{record.timestamp.toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'medium' })}</td>
                        <td>{record.trainset}</td>
                        <td>{record.name}</td>
                        <td>{record.mode.toUpperCase()}</td>
                        <td>{record.sensorTemp.toFixed(2)} °C</td>
                        <td>{record.hdcTemp.toFixed(2)} °C</td>
                        <td>{record.difference.toFixed(2)} °C</td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
{:else}
    <p class="no-data">No data has been recorded yet. Go to the dashboard to record data.</p>
{/if}

<style>
    /* Paste the table-related styles from your original file here */

    @reference "tailwindcss";

    h2 { color: #34495e; margin-top: 0; }
    .history-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .export-btn { padding: 0.7rem 1.2rem; font-size: 0.9rem; border: none; background-color: #16a085; color: white; border-radius: 8px; cursor: pointer; transition: background-color 0.2s ease; font-weight: 600; }
    .export-btn:hover { background-color: #117a65; }
    .table-container { margin-top: 1rem; overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; background: white; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); border-radius: 12px; overflow: hidden; }
    th, td { padding: 1rem; text-align: left; }
    thead { background-color: #34495e; color: white; }
    tbody tr:nth-child(even) { background-color: #f9f9f9; }
    .no-data { margin-top: 3rem; color: #7f8c8d; font-size: 1.2rem; }
</style>