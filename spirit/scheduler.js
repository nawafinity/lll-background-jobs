/**
 * Imports
 */
const Queue = require('bull')

const applicationJobQueue = new Queue('topics-queue', {
    redis: {
        host: 'localhost',
        port: '6379'
    }
});


module.exports = applicationJobQueue;
