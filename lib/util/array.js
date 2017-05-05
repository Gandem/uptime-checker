/**
 * @fileoverview Helper for handling arrays.
 * @module util/arrays
 * @author Nayef Ghattas
 */

'use strict';

// ------------------------------------------------------------------------------
// Functions
// ------------------------------------------------------------------------------

/**
 * Return the array maximum
 * @param {Array} array
 * @return {Number}
 */
function max(array) {
    return Math.max.apply(null, array);
}

/**
 * Return the array minimum
 * @param {Array} array
 * @return {Number}
 */
function min(array) {
    return Math.min.apply(null, array);
}

/**
 * Return the array range
 * @param {Array} array
 * @return {Number}
 */
function range(array) {
    return max(array) - min(array);
}

/**
 * Return the array midrange
 * @param {Array} array
 * @return {Number}
 */
function midrange(array) {
    return range(array) / 2;
}

/**
 * Return the sum of the array's elements
 * @param {Array} array
 * @return {Number}
 */
function sum(array) {
    let num = 0;
    for (let i = 0, l = array.length; i < l; i += 1) {
        num += array[i];
    }
    return num;
}

/**
 * Return the mean of the array's elements
 * @param {Array} array
 * @return {Number}
 */
function mean(array) {
    return sum(array) / array.length;
}

/**
 * Return the median of the array's elements
 * @param {Array} array
 * @return {Number}
 */
function median(array) {
    array.sort((a, b) => a - b);
    const mid = array.length / 2;
    return mid % 1 ? array[mid - 0.5] : (array[mid - 1] + array[mid]) / 2;
}

/**
 * Return the variance of the array's elements
 * @param {Array} array
 * @return {Number}
 */
function variance(array) {
    const arrayMean = mean(array);
    return mean(array.map(num => (num - arrayMean) ** 2));
}

/**
 * Return the standard deviation of the array's elements
 * @param {Array} array
 * @return {Number}
 */
function standardDeviation(array) {
    return Math.sqrt(variance(array));
}

// ------------------------------------------------------------------------------
// Public API
// ------------------------------------------------------------------------------

module.exports = { max, min, range, midrange, sum, mean, median, variance, standardDeviation };

