'use strict';

function max(array) {
    return Math.max.apply(null, array);
}

function min(array) {
    return Math.min.apply(null, array);
}

function range(array) {
    return max(array) - min(array);
}

function midrange(array) {
    return range(array) / 2;
}

function sum(array) {
    let num = 0;
    for (let i = 0, l = array.length; i < l; i += 1) {
        num += array[i];
    }
    return num;
}

function mean(array) {
    return sum(array) / array.length;
}

function median(array) {
    array.sort((a, b) => a - b);
    const mid = array.length / 2;
    return mid % 1 ? array[mid - 0.5] : (array[mid - 1] + array[mid]) / 2;
}

function variance(array) {
    const arrayMean = mean(array);
    return mean(array.map(num => (num - arrayMean) ** 2));
}

function standardDeviation(array) {
    return Math.sqrt(variance(array));
}

module.exports = { max, min, range, midrange, sum, mean, median, variance, standardDeviation };

