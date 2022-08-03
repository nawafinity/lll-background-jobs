/**
 * imports
 */
const { server, app } = require('./express')
const queue = require('./scheduler')
const { Server } = require("socket.io");
const redis = require('./redis')
/**
 * Our socket instance.
 */
const io = new Server(server)

module.exports = {
    app,
    socket: io,
    queue,
    redis
}
