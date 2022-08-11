const axios = require('axios')

const get = () => {
    
return new Promise(async (resolve, reject) => {
    const API_KEY = '244c4b48eadb783a69cc47eb2b24d6e89c708f3657917efca4b3f5c7b2d6d23c'
    const topic = "Testing"
    const resources = []
    const result = await axios.get(
        `https://serpapi.com/search?engine=google_scholar&api_key=${API_KEY}&q=${topic}`
    );
    // updateProgress(currentJob, ++progress);

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
                    //console.log('testt')

                    //console.log(resource.resources=element.link)

                    //resource.link=element.link

                    element.resources.forEach((r) => {
                        resource.link = r.link;
                        return;
                    });
                }

                // progrss = progrss + 5;

                resources.push(resource);

                // socket.emit(`job-${currentJob.id}-progress`, [progrss]);

                // currentJob.progress(progrss);
            });
        }

        // const currentData = currentJob.data;

        // currentData.resources = resources;

        // await currentJob.update(currentData);

        // socket.emit(`job-${currentJob.id}-progress`, 100);

        // currentJob.progress(100);

        resolve(resources);
    } else {
        // await currentJob.moveToFailed();

        reject(false);
    }
    
});

}


get().then((r) => {
    console.log(r)
})