/**
 * Imports
 */
const { getAllJobs } = require('./helpers/actions');
const { app, socket, queue, redis } = require('./spirit/core')
const log = require('log-beautify');
const { jobHandler } = require('./helpers/jobs');

/**
 * Express configurations
 */
socket.on('connection', (client) => {
    log.info(`Someone join the party: ${client.id}`)

    /**
     * Return back all the jobs to the user
     */
    client.on('get all jobs', async () => {
        log.warn('Someone asked to get all jobs.')
        const jobs = await getAllJobs()
        socket.emit('take all jobs', jobs)
    })

    client.on('connect to redis', async () => {
        await redis.connect()
        log.success('[Redis] successfully connected.')
        socket.emit('redis connected')
    })


})

/**
 * Proccess our jobs
 */
queue.process((job, done) => {
    // Emit all new topics to socket.
    socket.emit('topics', job)

    jobHandler(job).then(() => {
        // Close this job forever
        done()

        // Reload UI
        socket.emit('hydrate')
    })
})

// Our redis client, we will initilize it in `/api/connect`
let interval;

/**
 * Main moniter page
 */
app.get('/', function (req, res) {
    res.sendFile('views/index.html', {
        root: __dirname
    });
});

/**
 * An api to close the connection.
 */
app.post('/api/reset', function (req, res, next) {
    clearInterval(interval);
    socket.close();
    res.send({
        status: 'OK'
    });
});

/**
 * An api to fake some jobs
 */
app.get('/api/jobs/create', async (request, response, next) => {
    if (queue) {
        const opts = { priority: 0, attempts: 5 };
        await queue.add({ name: "Nawaf" }, {}, {
            attempts: opts.attempts,
            backoff: {
                type: "exponential",
                delay: 0,
            },
            removeOnComplete: false,
            removeOnFail: false,
        });

        response.status(200).json({
            success: true
        })

    } else {
        response.send('Are you sure your redis server is running?')
    }
})

