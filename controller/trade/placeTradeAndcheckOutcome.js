// Function to check if the trade is won or lost

const { manageListeners, sendRequest } = require("./listenerManager");
const { socketConfig } = require("./socketConfig");





function checkTradeOutcome(ws, contract_id, symbol, stake, type, step, res, wins, loss, initialStake) {
    console.log('checkTradeOutcome block');
    let standardWin = 5;
    let standardLoss = 4;
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
                    if ((wins + 1) < 5) {
                        console.log('Contract won, printing more');
                        manageListeners(ws, 'message', listener, 'remove');
                        placeMartingaleTrade(ws, symbol, type, initialStake, res, step + 1, wins + 1, 0, initialStake);
                        manageListeners(ws, 'message', tickStreamlistener, 'remove');
                    } else {

                        ws.close(3001, "closed after max win<>");
                    }




                } else {
                    var lossingStreak = loss + 1;
                    if ((lossingStreak) < 4) {
                        console.log('Contract loss, recouping');
                        manageListeners(ws, 'message', listener, 'remove');
                        placeMartingaleTrade(ws, symbol, type, stake * 2, res, step + 1, wins, lossingStreak, initialStake);
                        manageListeners(ws, 'message', tickStreamlistener, 'remove');
                    } else {

                        ws.close(3001, " closed after max loss<>");
                    }


                }


            }
            else {
                console.log("isSold Section<<<>>>");

                if (response["proposal_open_contract"]["expiry_time"] === response["proposal_open_contract"]["exit_tick_time"]) {
                    if ((parseFloat(response["proposal_open_contract"]["profit"]) > 0)) {
                        if ((wins + 1) < 5) {
                            console.log('Contract won, printing more');
                            manageListeners(ws, 'message', listener, 'remove');
                            placeMartingaleTrade(ws, symbol, type, initialStake, res, step + 1, wins + 1, 0, initialStake);
                            manageListeners(ws, 'message', tickStreamlistener, 'remove');
                        } else {

                            ws.close(3001, "closed after max win<>");
                        }




                    } else {
                        var lossingStreak = loss + 1;
                        if ((lossingStreak) < 4) {
                            console.log('Contract loss, recouping');
                            manageListeners(ws, 'message', listener, 'remove');
                            placeMartingaleTrade(ws, symbol, type, stake * 2, res, step + 1, wins, lossingStreak, initialStake);
                            manageListeners(ws, 'message', tickStreamlistener, 'remove');
                        } else {

                            ws.close(3001, "closed after max loss<>");
                        }


                    }

                } else {

                    ws.close(3001, "sold<>");
                }



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

            if (seconds === 58) {
                console.log(`${rem}  monitoring ..............`);
            }

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

                sendRequest(ws, checkRequest);
                manageListeners(ws, 'message', listener);


            }
        }
    };

    //subscribe and listen to tick again

    sendRequest(ws, subscribeRequest);
    console.log("subscribed for outcome");
    manageListeners(ws, 'message', tickStreamlistener);


   






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



// Function to place a Martingale trade
function placeMartingaleTrade(ws, symbol, type, stake, res, step, wins, loss, initialStake) {
    console.log(`Placing trade v3 with stake: ${stake} USD. Step: ${step}`);
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

module.exports = {
    checkTradeOutcome, placeMartingaleTrade

}