/**
 * Imports
 */
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const http = require('http')
const log = require('log-beautify');


const errorHandler = require('api-error-handler');
const port = process.env.PORT || 8080;

const server = http.createServer(app);
server.listen(port, function () {
    log.success(`Server has been started on: http://localhost:${port}/`)
});

app.use(express.static('public'));
app.use(bodyParser.urlencoded({
    extended: true
}));

let api = new express.Router();
api.use(errorHandler());
app.use('/api', api);

module.exports = {
    server,
    http,
    app
}
