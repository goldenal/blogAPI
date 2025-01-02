const { manageListeners, sendRequest } = require("./listenerManager");
const { placeMartingaleTrade } = require("./placeTradeAndcheckOutcome");
const WebSocket = require('ws');
const { API_TOKEN } = require("./socketConfig");






// Function to create the trade request for Up/Down options
function executeTradeAtNewCandle(ws, symbol, type, res, amt, mode) {
    const request = {
        authorize: API_TOKEN
    };

    ws.on('open', function open() {


        // Authorize the connection
        sendRequest(ws, request);

        ws.on('message', function incoming(data) {
            const response = JSON.parse(data);


            // Check if authorization is successful
            if (response.msg_type === 'authorize') {

                if (mode == "instant") {

                    placeMartingaleTrade(ws, symbol, type, amt, res, 1, 0, 0, amt);

                } else {
                    console.log(`Waiting for new candle to place ${type} trade on ${symbol}...`);
                    // Subscribe to tick stream for the given symbol
                    const subscribeRequest = {
                        ticks: symbol,
                        subscribe: 1
                    };


                    const tickStreamTheFirst = (data) => {
                        const response = JSON.parse(data);
                        if (response.msg_type === 'tick') {
                            // console.log(JSON.stringify(response));
                            const tickTime = new Date(response.tick.epoch * 1000);
                            const seconds = tickTime.getSeconds();
                            const minutes = tickTime.getMinutes();
                            const rem = minutes % 5;
                            console.log('New ca:first trade', seconds);
                            // Check if it's the start of a new minute (seconds == 0 means a new candle)
                            if (seconds === 0 && rem === 0) {
                                console.log('New candle started at:first trade', tickTime);

                                // Cancel the tick subscription after detecting new candle
                                const unsubscribeRequest = {
                                    forget_all: 'ticks'
                                };
                                sendRequest(ws, unsubscribeRequest);
                                manageListeners(ws, 'message', tickStreamTheFirst, 'remove');

                                placeMartingaleTrade(ws, symbol, type, amt, res, 1, 0, 0, amt);

                                // Build a trade request after authorization

                            }
                        }
                    };

                    //subscribe and listen to tick the first time
                    manageListeners(ws, 'message', tickStreamTheFirst);
                    sendRequest(ws, subscribeRequest);
                }





            }

            // // Handle the response for the trade
            // if (response.msg_type === 'buy') {
            //     const contract_id = response.buy.contract_id;
            //     console.log('Trade placed successfully. Contract ID:', contract_id);

            //     // After placing the trade, start checking for the outcome

            //     checkTradeOutcome(ws, contract_id, res, symbol);

            // }
        });
    });
}

module.exports = {
    executeTradeAtNewCandle

}