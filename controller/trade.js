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
function checkTradeOutcome(ws, contract_id, symbol, stake, type, step, res, wins, loss, initialStake) {

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
            var isSold = response["proposal_open_contract"]["is_sold"];
            if (isSold != 1) {
                //  console.log('<><<<>> ' + JSON.stringify(response["proposal_open_contract"]["is_sold"]));
                console.log(parseFloat(response["proposal_open_contract"]["profit"]) > 0);

                if ((parseFloat(response["proposal_open_contract"]["profit"]) > 0)) {
                    if ((wins + 1) < 1) {
                        console.log('Contract won, printing more');
                        manageListeners(ws, 'message', listener, 'remove');
                        placeMartingaleTrade(ws, symbol, type, initialStake, res, step + 1, wins + 1, 0, initialStake);
                        manageListeners(ws, 'message', tickStreamlistener, 'remove');
                    } else {
                        ws.close();
                    }




                } else {
                    var lossingStreak = loss + 1;
                    if ((lossingStreak) < 3) {
                        console.log('Contract loss, recouping');
                        manageListeners(ws, 'message', listener, 'remove');
                        placeMartingaleTrade(ws, symbol, type, stake, res, step + 1, wins, lossingStreak, initialStake);
                        manageListeners(ws, 'message', tickStreamlistener, 'remove');
                    } else {
                        ws.close();
                    }


                }
            }
            else {
                ws.close();
            }



        }



    };


    const tickStreamlistener = (data) => {

        const response = JSON.parse(data);
        if (response.msg_type === 'tick') {
            const tickTime = new Date(response.tick.epoch * 1000);
            const seconds = tickTime.getSeconds();
            const minutes = tickTime.getMinutes();
            const rem = (minutes + 1) % 5;

            //  console.log('Tracking stream seconds:' + symbol, seconds);
            // Check if it's the start of a new minute (seconds == 0 means a new candle)
            if (seconds === 58 && rem === 0) {
                console.log(`Tracking ${symbol}, new candle at ${tickTime}`);


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


// Function to place a Martingale trade
function placeMartingaleTrade(ws, symbol, type, stake, res, step, wins, loss, initialStake) {
    console.log(`Placing trade with stake: ${stake} USD. Step: ${step}`);
    console.log(`Stats wins: ${wins} losses:${loss}`);
    const tradeRequest = {
        buy: 1,
        price: stake,
        parameters: {
            amount: stake,
            basis: 'stake',
            contract_type: type, // 'CALL' for Up, 'PUT' for Down
            currency: 'USD',
            duration: 5,
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
            setTimeout(() => {
                checkTradeOutcome(ws, contract_id, symbol, stake, type, step, res, wins, loss, initialStake);
                manageListeners(ws, 'message', handleTradeResponse, 'remove');
            }, 3000);

        }
    };

    ws.on('message', handleTradeResponse);
}




const placeTrade = async (req, res) => {

    const { symbol, type, startingAmount, mode } = req.params;


    if (!instruments.includes(symbol)) {
        return res.status(400).send('Invalid symbol');
    }
    if (mode != 'watch' && mode != 'instant') {
        return res.status(400).send('Invalid mode, use watch or instant');
    }


    if (type !== 'CALL' && type !== 'PUT') {
        return res.status(400).send('Invalid option type. Use CALL for Up, PUT for Down.');
    }

    const ws = new WebSocket(API_URL);
    // Make a trading option based on the requested type
    executeTradeAtNewCandle(ws, symbol, type, res, startingAmount, mode);

    res.send(`Order of type ${type} reccieved on ${symbol} with mode ${mode}`);
}

module.exports = {
    placeTrade

}

