const express = require('express');
const router = express.Router();
const tradeController = require('../controller/trade');

router.route('/:symbol/:type/:startingAmount/:mode')
    .post(tradeController.placeTrade);

module.exports = router;