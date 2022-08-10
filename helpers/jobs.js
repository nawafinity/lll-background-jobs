const { queue, socket } = require('../spirit/core')

/**
 *
 * @param {*} job
 * @returns Promise
 */
const jobHandler = async (job) => {
    const currentJob = await queue.getJob(job.id)

    socket.emit(`job-${currentJob.id}-progress`, 5)
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


module.exports = {
    jobHandler
}
