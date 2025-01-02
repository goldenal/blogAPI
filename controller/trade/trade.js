const WebSocket = require('ws');

const { executeTradeAtNewCandle } = require('./executeTradeAtNewCandle');
const { socketConfig } = require('./socketConfig');


//const API_TOKEN = '6qgA57lTScuQ5me';
//              't2xQXkeeUW0IFEf'//li

const instruments = ['R_10', 'R_25', 'R_50', 'R_75', 'R_100'];





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


    const ws = socketConfig();

    // Make a trading option based on the requested type
    executeTradeAtNewCandle(ws, symbol, type, res, startingAmount, mode);


    res.send(`Order of type ${type} reccieved on ${symbol} with mode ${mode}`);
}



module.exports = {
    placeTrade

}

