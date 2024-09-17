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
function checkTradeOutcome(ws, contract_id, res) {
    const checkRequest = {
        proposal_open_contract: 1,
        contract_id: contract_id
    };



    const listener = (data) => {
        const response = JSON.parse(data);



        if (response.msg_type === 'proposal_open_contract') {
            console.log('<><<<>> ' + JSON.stringify(response, null, 2));

            if (response["proposal_open_contract"]["status"] === 'open') {
                console.log('Contract still open. Checking again in 5sec  ...');
                manageListeners(ws, 'message', listener, 'remove');
                setTimeout(() => checkTradeOutcome(ws, contract_id, res), 5000); // Check again after 5 seconds

            } else {
                if (response["proposal_open_contract"]["status"] === 'won') {
                    console.log('won');
                    // res.send('Trade WON! Profit: ' + contract?.profit);
                } else {
                    console.log('lost');
                    // res.send('Trade LOST! Loss: ' + contract?.profit);
                }

                // Remove the listener after contract is closed
                manageListeners(ws, 'message', listener, 'remove');
                ws.close();

            }

        }


    };

    // Add the listener dynamically and send the request
    manageListeners(ws, 'message', listener);
    sendRequest(ws, checkRequest);


}



// Utility function to send JSON data via WebSocket
function sendRequest(ws, data) {
    ws.send(JSON.stringify(data));
}


// Function to create the trade request for Up/Down options
function executeTradeAtNewCandle(ws, symbol, type, res) {
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
                sendRequest(ws, subscribeRequest);

                ws.on('message', function incoming(data) {
                    const response = JSON.parse(data);
                    if (response.msg_type === 'tick') {
                        const tickTime = new Date(response.tick.epoch * 1000);
                        const seconds = tickTime.getSeconds();
                        console.log('New ca:', seconds);
                        // Check if it's the start of a new minute (seconds == 0 means a new candle)
                        if (seconds === 58) {
                            console.log('New candle started at:', tickTime);

                            // Cancel the tick subscription after detecting new candle
                            const unsubscribeRequest = {
                                forget_all: 'ticks'
                            };
                            sendRequest(ws, unsubscribeRequest);

                            // Build a trade request after authorization
                            const tradeRequest = {
                                "buy": 1, // Buying a contract
                                "price": 10, // Stake amount in USD
                                "parameters": {
                                    "amount": 10,
                                    "basis": "stake",
                                    "contract_type": type, // 'CALL' for Up, 'PUT' for Down
                                    "currency": "USD",
                                    "duration": 1,
                                    "duration_unit": "m", // 1 minute duration
                                    "symbol": symbol // Volatility Index symbol
                                }

                            };
                            // Send the trade request
                            sendRequest(ws, tradeRequest);
                        }
                    }

                });

            }

            // Handle the response for the trade
            if (response.msg_type === 'buy') {
                const contract_id = response.buy.contract_id;
                console.log('Trade placed successfully. Contract ID:', contract_id);

                // After placing the trade, start checking for the outcome

                checkTradeOutcome(ws, contract_id, res);

            }
        });
    });
}


const placeTrade = async (req, res) => {

    const { symbol, type } = req.params;

    if (!instruments.includes(symbol)) {
        return res.status(400).send('Invalid symbol');
    }

    if (type !== 'CALL' && type !== 'PUT') {
        return res.status(400).send('Invalid option type. Use CALL for Up, PUT for Down.');
    }

    const ws = new WebSocket(API_URL);
    // Make a trading option based on the requested type
    executeTradeAtNewCandle(ws, symbol, type, res);

    res.send(`Placing a ${type} trade on ${symbol}`);
}

module.exports = {
    placeTrade

}
