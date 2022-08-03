/**
 * Imports
 */
const { getAllJobs } = require('./helpers/actions');
const { app, socket, queue, redis } = require('./spirit/core')
const log = require('log-beautify')

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
        done()
        socket.emit('hydrate')
    })
})

// Our redis client, we will initilize it in `/api/connect`
let interval;

let jobQueue;

/**
 * Start Express
 */


/**
 * Main moniter page
 */
app.get('/', function (req, res) {
    res.sendFile('views/index.html', {
        root: __dirname
    });
});

/**
 * Job handler
 *
 * This function will use to handle the created jobs.
 */
async function jobHandler(job) {
    const currentJob = await queue.getJob(job.id)

    socket.emit(`job-${currentJob.id}-progress`, 3)
    currentJob.progress(3)

    return new Promise((resolve, reject) => {
        setTimeout(() => {
            currentJob.progress(55)
            socket.emit(`job-${currentJob.id}-progress`, 55)



            setTimeout(() => {
                currentJob.progress(100)
                socket.emit(`job-${currentJob.id}-progress`, 100)
                resolve('done')
            }, 3000)
        }, 2000)
    })
}
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

app.get('/api/jobs/all', async (req, res, next) => {
    const completedJobs = await queue.getJobs(['completed'])
    const activeJobs = await queue.getJobs(['active'])
    const pausedJobs = await queue.getJobs(['paused'])
    const delayedJobs = await queue.getJobs(['delayed'])
    const failedJobs = await queue.getJobs(['failed'])

    res.status(200).json({
        completed: completedJobs,
        active: activeJobs,
        paused: pausedJobs,
        delayed: delayedJobs,
        failed: failedJobs
    })
})

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

/**
 * An api to check the connection (Redis connection),
 * this going to keep trying until connection
 */
app.post('/api/connect', async function (request, response, next) {
    let host = request.body.host,
        port = request.body.port;

    let redisClient = createClient({
        url: 'redis://' + ':' + '' + '@' + host + ':' + port
    });

    // Redis not connected
    redisClient.on('error', function (err) {
        return next(err);
    });


    // Wait for redis
    await redisClient.connect()
    console.log('[Redis] Connected.')
    return response.status(200).json({
        status: 'OK'
    })
});
