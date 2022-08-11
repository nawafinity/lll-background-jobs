const { queue, socket } = require("../spirit/core");
const axios = require('axios')

/**
 * 
 * @param {*} message 
 */
const sendMessageToTeams = async (message) => {
    socket.emit('teams message', message)
}
/**
 * 
 * @param {*} job 
 * @param {*} progress 
 */
const updateProgress = (job, progress) => {
    socket.emit(`job-${job.id}-progress`, progress);
    job.progress(progress);
};
/**
 *
 * @param {*} job
 * @returns Promise
 */
const jobHandler = async (job) => {
    const API_KEY =
        "244c4b48eadb783a69cc47eb2b24d6e89c708f3657917efca4b3f5c7b2d6d23c";
    const currentJob = await queue.getJob(job.id);
    let progress = 10;

    updateProgress(currentJob, progress);

    return new Promise(async (resolve, reject) => {
        const result = await axios.get(
            `https://serpapi.com/search?engine=google_scholar&api_key=${API_KEY}&q=${currentJob.data.SbjectName}`
        );

        let resources = [];

        updateProgress(currentJob, ++progress);

        if (typeof result.data === "object") {
            const data = result.data;
            if (data.hasOwnProperty("organic_results")) {
                const organicResults = data.organic_results;

                //console.log('organic_results')

                organicResults.forEach((element) => {
                    const resource = {};

                    if (element.hasOwnProperty("title")) {
                        resource.title = element.title;
                    }

                    if (element.hasOwnProperty("resources")) {
                        element.resources.forEach((r) => {
                            if (typeof r.link !== "undefined") {
                                resource.link = r.link;
                                return;
                            }
                        });
                    }

                    if (typeof resource.link !== "undefined") {
                        resources.push(resource);
                    }

                    progress = progress + 5;
                    updateProgress(currentJob, progress);
                });
            }

            // Update job data.
            const currentData = currentJob.data;
            currentData.resources = resources;
            console.log(currentData)

            await currentJob.update(currentData);

            progress = 100;
            updateProgress(currentJob, progress);
            resolve(resources);
        } else {
            await currentJob.moveToFailed();
            reject(false);
        }
    });
};

module.exports = {
    jobHandler,
};
