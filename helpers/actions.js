const { queue } = require('../spirit/core')

const getAllJobs = async () => {
    return new Promise(async resolve => {
        const completedJobs = await queue.getJobs(['completed'])
        const activeJobs = await queue.getJobs(['active'])
        const pausedJobs = await queue.getJobs(['paused'])
        const delayedJobs = await queue.getJobs(['delayed'])
        const failedJobs = await queue.getJobs(['failed'])
        const waitingJobs = await queue.getJobs(['waiting'])


        resolve({
            waiting: waitingJobs,
            completed: completedJobs,
            active: activeJobs,
            paused: pausedJobs,
            delayed: delayedJobs,
            failed: failedJobs
        })
    })
}


module.exports = {
    getAllJobs
}
