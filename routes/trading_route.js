const express = require('express');
const router = express.Router();
const tradeController = require('../controller/trade');

router.route('/:symbol/:type')
    .post(tradeController.placeTrade);

module.exports = router;