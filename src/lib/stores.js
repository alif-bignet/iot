import { writable } from 'svelte/store';

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

/**
 * A writable Svelte store that holds an array of recordings.
 * @type {import('svelte/store').Writable<Recording[]>}
 */
export const recordings = writable([]);