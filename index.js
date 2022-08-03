/**
 * Imports
 */
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const http = require('http')
const { Server } = require("socket.io");
const { createClient } = require('redis');
const Queue = require('bull')

/**
 * Express configurations
 */
const errorHandler = require('api-error-handler');
const port = process.env.PORT || 8080;

const server = http.createServer(app);
server.listen(port, function () {
    console.log('Server Started. Listening on *:' + port);
});

app.use(express.static('public'));
app.use(bodyParser.urlencoded({
    extended: true
}));

let api = new express.Router();
api.use(errorHandler());
app.use('/api', api);

/**
 * Connect to socket
 */
const io = new Server(server)
io.on('connection', (socket) => {
    console.log(`[Socket] Connected ${socket.id}`)
})


/**
 * Variables
 */

// Our job queue, thankx for `Bull` it's make it easy
let applicationJobQueue = new Queue('topics-queue', {
    redis: {
        host: 'localhost',
        port: '6379'
    }
});

/**
 * Proccess our jobs
 */
applicationJobQueue.process((job, done) => {
    // Emit all new topics to socket.
    io.emit('topics', job)

    jobHandler(job).then(() => {
        console.log('done')
        done()
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
    const currentJob = await applicationJobQueue.getJob(job.id)

    io.emit(`job-${currentJob.id}-progress`, 3)
    currentJob.progress(3)

    return new Promise((resolve, reject) => {
        setTimeout(() => {
            currentJob.progress(55)
            io.emit(`job-${currentJob.id}-progress`, 55)



            setTimeout(() => {
                currentJob.progress(100)
                io.emit(`job-${currentJob.id}-progress`, 100)
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
    io.close();
    res.send({
        status: 'OK'
    });
});

app.get('/api/jobs/all', async (req, res, next) => {
    const completedJobs = await applicationJobQueue.getJobs(['completed'])
    const activeJobs = await applicationJobQueue.getJobs(['active'])
    const pausedJobs = await applicationJobQueue.getJobs(['paused'])
    const delayedJobs = await applicationJobQueue.getJobs(['delayed'])
    const failedJobs = await applicationJobQueue.getJobs(['failed'])

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
    if (applicationJobQueue) {
        const opts = { priority: 0, attempts: 5 };
        await applicationJobQueue.add({ name: "Nawaf" }, {}, {
            attempts: opts.attempts,
            backoff: {
                type: "exponential",
                delay: 2000,
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

let _init = function () {
    let connectionDetails = {
        redis: client
    };

    let queue = new NR.queue({
        connection: connectionDetails
    });

    queue.on('error', function (error) {
        console.log(error);
    });

    let _processQueue = function () {
        let mainData = [];
        let count = 0;
        queue.queues(function (e, qList) {
            async.each(qList, function (q, cb) {
                queue.queued(q, 0, -1, function (e, jobs) {
                    let data = {
                        q: q,
                        jobs: jobs
                    };
                    mainData.push(data);
                    count++;
                    if (count === qList.length) {
                        cb(mainData);
                    }
                });
            }, function (e) {
                io.emit('qData', mainData);
            });
        });
        queue.allWorkingOn(function (e, hashList) {
            io.emit('qWorkersHashList', hashList);
        });
        queue.stats(function (e, cs) {
            io.emit('clusterStats', cs);
        });
    };

    let _updateQueue = function () {
        let mainData = [];
        let count = 0;
        queue.queues(function (e, qList) {
            async.each(qList, function (q, cb) {
                queue.queued(q, 0, -1, function (e, jobs) {
                    let data = {
                        q: q,
                        jobs: jobs
                    };
                    mainData.push(data);
                    count++;
                    console.log(count, qList.length);
                    if (count === qList.length) {
                        cb(mainData);
                    }
                });
            }, function (e) {
                console.log('woot');
                io.emit('qDataUpdate', mainData);
            });
        });
        queue.allWorkingOn(function (e, hashList) {
            io.emit('qWorkersHashListUpdate', hashList);
        });
        queue.stats(function (e, cs) {
            io.emit('clusterStatsUpdate', cs);
        });
    };

    queue.connect(function () {
        _processQueue();
        interval = setInterval(function () {
            _updateQueue();
        }, 3000);
    });

    return queue;
};
