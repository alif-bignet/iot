import { writable } from 'svelte/store';
import { Storage } from '@ionic/storage';
import { browser } from '$app/environment';

/**
 * @typedef {Object} Recording
 * @property {Date} timestamp
 * @property {string} trainset
 * @property {string} name
 * @property {string} mode
 * @property {number} sensorTemp
 * @property {number} hdcTemp
 * @property {number} difference
 */

const recordingsWritable = writable([]);
let storage;

/**
 * A custom Svelte store that holds an array of recordings and persists them to Ionic Storage.
 */
export const recordings = {
    subscribe: recordingsWritable.subscribe,

    init: async () => {
        if (!browser || storage) return; // Guard against server-side execution and re-initialization

        storage = new Storage();
        await storage.create();
        const initialValue = await storage.get('recordings') || [];
        recordingsWritable.set(initialValue.map(r => ({ ...r, timestamp: new Date(r.timestamp) })));
    },

    set: async (value) => {
        if (!storage) await recordings.init();
        await storage.set('recordings', value);
        recordingsWritable.set(value);
    },

    update: async (updater) => {
        if (!storage) await recordings.init();
        const currentValue = (await storage.get('recordings') || []).map(r => ({ ...r, timestamp: new Date(r.timestamp) }));
        const newValue = updater(currentValue);
        await storage.set('recordings', newValue);
        recordingsWritable.set(newValue);
    },

    deleteRecording: async (timestamp) => {
        if (!storage) await recordings.init();
        const currentValue = (await storage.get('recordings') || []).map(r => ({ ...r, timestamp: new Date(r.timestamp) }));
        const newValue = currentValue.filter(rec => rec.timestamp.getTime() !== new Date(timestamp).getTime());
        await storage.set('recordings', newValue);
        recordingsWritable.set(newValue);
    },

    clearAll: async () => {
        if (!storage) await recordings.init();
        await storage.set('recordings', []);
        recordingsWritable.set([]);
    }
};