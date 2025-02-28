const WebSocket = require('ws');
const { sendRequest } = require('./listenerManager');
const API_URL = 'wss://ws.derivws.com/websockets/v3?app_id=64155';
const API_TOKEN = "t2xQXkeeUW0IFEf";
//'t2xQXkeeUW0IFEf'; 6qgA57lTScuQ5me

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
   // startPing(ws);
    return ws;

}

// Function to send a ping message every 30 seconds
const startPing = (ws) => {
    const pingInterval = 30000; // 30 seconds
    const interval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ ping: 1 }));
            console.log('Ping sent to keep connection alive...................');
        }
    }, pingInterval);
    // Clear the interval when the connection is closed
    ws.on('close', () => {
        clearInterval(interval);
        console.log('Connection closed, stopping ping.');
    });
}

function openAndAutheticateSocket(ws, action){
    ws.on('open', function open() {
        const request = {
            authorize: API_TOKEN
        };
        // re Authorize the connection
        sendRequest(ws, request);
        ws.on('message', function incoming(data) {
            const response = JSON.parse(data);
            
            // Check if authorization is successful
            if (response.msg_type === 'authorize') {
                action;

            }
        });

    });

}


module.exports = {
    socketConfig, API_TOKEN,openAndAutheticateSocket

}

