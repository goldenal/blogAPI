const WebSocket = require('ws');
const API_URL = 'wss://ws.derivws.com/websockets/v3?app_id=64155';

function socketConfig() {

    const ws = new WebSocket(API_URL);

    // Event handler for when the WebSocket connection is closed
    ws.onclose = function (event) {
        if (event.wasClean) {
            console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`); // Log clean close with code and reason
        } else {
            console.log(`[close] Connection died  code=${event.code} type=${event.type}  reason=${event.reason}`); // Log an abrupt close
        }
    };
    ws.onerror = function (error) {
        console.log(`[error] ${error.message}`); // Log the error that occurred
    };
    return ws;

}

module.exports = {
    socketConfig

}

