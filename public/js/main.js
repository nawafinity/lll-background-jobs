let connected = false;
let jobs = {}

let loadingHeader = $('[data-loading-header]')
let loadingDescription = $('[data-loading-description]')
let loader = $("#loader")


const socket = io()
let socketClientId = null;

// Connect to socket
socket.on("connect", () => {
    socketClientId = socket.id
});

socket.on('topics', () => {
    // Get all jobs again
    socket.emit('get all jobs')
})

/**
 * Refresh lists and counters
 */
socket.on('hydrate', () => {
    socket.emit('get all jobs')
})

socket.on('take all jobs', (data) => {
    fillfull(data).then(() => {
        if (!connected) {
            setTimeout(() => {
                loader.html(`<i class="bi bi-emoji-smile text-pink" style="font-size: 64px"></i>`)
                loadingHeader.text('All set')
                loadingDescription.text('Redirecting you to moniter...')

                setTimeout(() => {
                    $("#connecting").hide()
                    $("body").addClass('connected')
                    resizeJobLogsToFitTheWindow()
                    connected = true
                }, 1500)
            }, 3000)
        }

        // Do nothing
    })
})

/**
 * Check if redis is connecting or not.
 * Then get the jobs list.
 */
socket.on('redis connected', () => {
    loader.removeClass('spinner-border')
    loader.addClass('text text-success')
    loader.html(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" class="bi bi-check-lg" viewBox="0 0 16 16">
    <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z"/>
  </svg>`)
    loadingHeader.text('Connected')
    loadingDescription.text('We succesfully connected to your JobsQueue.')

    $(this).delay(1500).queue(() => {
        loader.html(`<i class="bi bi-chevron-bar-contract" style="font-size: 64px"></i>`)
        loadingHeader.text('Getting Data')
        loadingDescription.text('We getting and gathering data.')

        if (socketClientId) {
            loadingDescription.append(`<span class="d-block mt-1 text-primary">Your socket id: ${socket.id}</span>`)
        }

        // Get all data
        socket.emit('get all jobs')
    })
})

const connect = (retry = false, round = 0) => {
    loadingHeader.html('Please wait')
    loadingDescription.html('We getting things ready')

    if (retry) {
        loadingHeader.html(`<span class='text text-danger'>Retry connecting...<span>`)
        loadingDescription.html('Connection failed, we will keep retrying, please make sure that your redis server is started.')

        if (round && round > 0) {
            loadingDescription.append(`<strong class='d-block mt-3 text text-info'>Round: ${round}</span>`)
        }
    }

    $(this).delay(3000).queue(function () {
        // Try to connect to redis
        socket.emit('connect to redis')
        $(this).dequeue();

    });

}

function fillfull(newJobs) {
    return new Promise((resolve, reject) => {
        jobs = newJobs

        if (typeof jobs !== 'object') {
            reject('job variable not a valid object')
            return;
        }

        for (let key in jobs) {
            $(`[data-log-${key}]`).html('')
        }
        for (let key in jobs) {

            $(`[data-stats-${key}]`).text(jobs[key].length)

            // List jobs
            Array.from(jobs[key]).forEach((job, jobKey) => {
                const iconsMapping = {
                    completed: 'check',
                    waiting: 'play',
                    active: 'pause',
                    failed: 'arrow-clockwise'
                }

                const clickMapping = {
                    failed: `restartjob('${job.id}'`,
                    active: `pause('${job.id}')`,
                    paused: `resume('${job.id}')`,

                }
                let jobComponent = $('<div />')
                jobComponent.attr('id', `job-${job.id}-progress`)
                jobComponent.addClass('job')
                jobComponent.html(`
                <div class="job-title">${job.id}</div>
                <button class="btn btn-link job-pause ms-auto p-0" data-job-id="${job.id}" onclick="${clickMapping[key]}")"><i class="bi bi-${iconsMapping[key]}"></i></button>
                <div class="job-progress" style="width: ${job.progress}%"></div>
                `)
                $(`[data-log-${key}]`).append(jobComponent)

                socket.on(`job-${job.id}-progress`, (data) => {
                    $(`#job-${job.id}-progress .job-progress`).css('width', `${data}%`)
                })
            })
        }

        resolve(true)


    })
}


function resizeJobLogsToFitTheWindow() {
    // What a long function name :P

    const headerSec = document.getElementById("header")
    const mainSec = document.getElementsByTagName("main")[0]

    if (headerSec && mainSec) {
        const headerHeight = headerSec.offsetHeight
        const windowHeight = document.body.offsetHeight

        mainSec.style.height = `calc(${(windowHeight - headerHeight)}px - 8px)`
        mainSec.style.marginTop = '8px'
    }

}
document.addEventListener('DOMContentLoaded', () => {

    /**
     * Connect to redis first
     */
    connect(false)


    // All listeners go here
    $("#clearBtn").on('click', () => {
        socket.emit('clear jobs queue')
    })


    window.restartjob = (jobID) => {
        socket.emit('restart job', jobID)
    }

    window.pause = (jobID) => {
        socket.emit('pause job', jobID)
    }

    window.resume = (jobID) => {
        socket.emit('resume job', jobID)
    }

})


// Get user input

const SbjectName = document.getElementById('Sname');
const StartDate = document.getElementById('Sdate');
const EndDate = document.getElementById('Edate');
const Limit = document.getElementById('times_repeat');
const Every = document.getElementById('every');


// validate end date

//if (EndDate<=StartDate) {
// return false;
//}

// Make current date the default value in the form

// ✅ Using the visitor's timezone
StartDate.value = formatDate();
EndDate.value = formatDate();

console.log(formatDate());

function padTo2Digits(num) {
    return num.toString().padStart(2, '0');
}

function formatDate(date = new Date()) {
    return [
        date.getFullYear(),
        padTo2Digits(date.getMonth() + 1),
        padTo2Digits(date.getDate()),
    ].join('-');
}



// create job with job info that user inserted

const AddJob = () => {

    var JobInfo = {
        SbjectName: SbjectName.value,
        Start_Date: StartDate.value,
        End_Date: EndDate.value,
        Times_repeat: Limit.value,
        Period: Every.value
    };

    if (EndDate.value <= StartDate.value) {
        alert("invalid date");
    }
    else {
        socket.emit('create job', JobInfo)
    }

}
