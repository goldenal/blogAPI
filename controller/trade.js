const WebSocket = require('ws');

const API_TOKEN = '6qgA57lTScuQ5me';
const API_URL = 'wss://ws.binaryws.com/websockets/v3?app_id=64155';
const instruments = ['R_10', 'R_25', 'R_50', 'R_75', 'R_100'];

// Generic utility to manage WebSocket listeners
function manageListeners(ws, event, listener, action = 'add') {
    if (action === 'add') {
        ws.on(event, listener);
    } else if (action === 'remove') {
        ws.removeListener(event, listener);
    }
}


// Function to check if the trade is won or lost
function checkTradeOutcome(ws, contract_id, symbol, type, step) {

    const checkRequest = {
        proposal_open_contract: 1,
        contract_id: contract_id
    };

    // Subscribe to tick stream for the given symbol again
    const subscribeRequest = {
        ticks: symbol,
        subscribe: 1
    };



    const listener = (data) => {
        const response = JSON.parse(data);



        if (response.msg_type === 'proposal_open_contract') {
            console.log('<><<<>> ' + response["proposal_open_contract"]["profit"]);
            console.log(parseFloat(response["proposal_open_contract"]["profit"]) > 0);

            if (response["proposal_open_contract"]["status"] === 'open') {
                console.log('Contract still open. Checking again in 5sec  ...');
                manageListeners(ws, 'message', listener, 'remove');



            } else {


                // Remove the listener after contract is closed
                manageListeners(ws, 'message', listener, 'remove');
                ws.close();

            }

        }


    };


    const tickStreamlistener = (data) => {

        const response = JSON.parse(data);
        if (response.msg_type === 'tick') {
            const tickTime = new Date(response.tick.epoch * 1000);
            const seconds = tickTime.getSeconds();
            console.log('New stream:', seconds);
            // Check if it's the start of a new minute (seconds == 0 means a new candle)
            if (seconds === 58) {
                console.log('New candle started at:', tickTime);

                // Cancel the tick subscription after detecting new candle
                const unsubscribeRequest = {
                    forget_all: 'ticks'
                };
                sendRequest(ws, unsubscribeRequest);

                //monitor the outcome of the trade
                manageListeners(ws, 'message', listener);
                sendRequest(ws, checkRequest);


            }
        }
    };

    //subscribe and listen to tick again
    manageListeners(ws, 'message', tickStreamlistener);
    sendRequest(ws, subscribeRequest);







}



// Utility function to send JSON data via WebSocket
function sendRequest(ws, data) {
    ws.send(JSON.stringify(data));
}


// Function to create the trade request for Up/Down options
function executeTradeAtNewCandle(ws, symbol, type, res, amt) {
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
                console.log(`Waiting for new candle to place ${type} trade on ${symbol}...`);
                // Subscribe to tick stream for the given symbol
                const subscribeRequest = {
                    ticks: symbol,
                    subscribe: 1
                };


                const tickStreamTheFirst = (data) => {
                    const response = JSON.parse(data);
                    if (response.msg_type === 'tick') {
                        const tickTime = new Date(response.tick.epoch * 1000);
                        const seconds = tickTime.getSeconds();
                        console.log('New ca:first trade', seconds);
                        // Check if it's the start of a new minute (seconds == 0 means a new candle)
                        if (seconds === 58) {
                            console.log('New candle started at:first trade', tickTime);

                            // Cancel the tick subscription after detecting new candle
                            const unsubscribeRequest = {
                                forget_all: 'ticks'
                            };
                            sendRequest(ws, unsubscribeRequest);
                            manageListeners(ws, 'message', tickStreamTheFirst, 'remove');

                            placeMartingaleTrade(ws, symbol, type, amt, res, 1);

                            // Build a trade request after authorization

                        }
                    }
                };

                //subscribe and listen to tick the first time
                manageListeners(ws, 'message', tickStreamTheFirst);
                sendRequest(ws, subscribeRequest);






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


// Function to place a Martingale trade
function placeMartingaleTrade(ws, symbol, type, stake, res, step) {
    console.log(`Placing trade with stake: ${stake} USD. Step: ${step}`);

    const tradeRequest = {
        buy: 1,
        price: stake,
        parameters: {
            amount: stake,
            basis: 'stake',
            contract_type: type, // 'CALL' for Up, 'PUT' for Down
            currency: 'USD',
            duration: 1,
            duration_unit: 'm',
            symbol: symbol
        }
    };

    sendRequest(ws, tradeRequest);

    const handleTradeResponse = (tradeData) => {
        const tradeResponse = JSON.parse(tradeData);
        if (tradeResponse.msg_type === 'buy') {
            const contract_id = tradeResponse.buy.contract_id;
            console.log('Trade placed successfully. Contract ID:', contract_id);

            // After placing the trade, start checking for the outcome
            checkTradeOutcome(ws, contract_id, symbol, stake, type, step);
            manageListeners(ws, 'message', handleTradeResponse, 'remove');
        }
    };

    ws.on('message', handleTradeResponse);
}




const placeTrade = async (req, res) => {

    const { symbol, type } = req.params;

    const { startingAmount } = req.body;
    if (!instruments.includes(symbol)) {
        return res.status(400).send('Invalid symbol');
    }
    if (startingAmount == null) {
        return res.status(400).send('Starting amount require');
    }

    if (type !== 'CALL' && type !== 'PUT') {
        return res.status(400).send('Invalid option type. Use CALL for Up, PUT for Down.');
    }

    const ws = new WebSocket(API_URL);
    // Make a trading option based on the requested type
    executeTradeAtNewCandle(ws, symbol, type, res, startingAmount);

    res.send(`Placing a ${type} trade on ${symbol}`);
}

module.exports = {
    placeTrade

}
