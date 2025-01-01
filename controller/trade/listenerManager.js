// Generic utility to manage WebSocket listeners
function manageListeners(ws, event, listener, action = 'add') {
    if (action === 'add') {
        ws.on(event, listener);
    } else if (action === 'remove') {
        ws.removeListener(event, listener);
    }
}



// Utility function to send JSON data via WebSocket
function sendRequest(ws, data) {
    ws.send(JSON.stringify(data));
}

module.exports = {
    manageListeners, sendRequest

}