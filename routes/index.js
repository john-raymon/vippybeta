var express = require('express');
var router = express.Router();

router.use('/beta', require('./beta_api'));

module.exports = router;
