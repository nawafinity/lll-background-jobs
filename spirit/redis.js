const { createClient } = require('redis');

let redisClient = createClient({
    url: `redis://:@localhost:6379`
});

redisClient.connect().then(() => {})


module.exports = redisClient
