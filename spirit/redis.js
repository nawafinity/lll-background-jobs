const { createClient } = require('redis');

let redisClient = createClient({
    url: `redis://:@localhost:6379`
});


module.exports = redisClient
