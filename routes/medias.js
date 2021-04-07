var express = require('express');
var _ = require('lodash');
var router = express.Router();
var db = require('../database.js');

// /!\ TODO USE REAL ORM FOR PREVENTING SQL INJECTION

/* GET users listing. */
router.delete("/:id", (req, res, next) => {
  db.run(
      'DELETE FROM media WHERE id = ?',
      req.params.id,
      function (err, result) {
        if (err){
          res.status(400).json({"error": res.message})
          return;
        }
        res.json({"message":" deleted"})
      });
})

module.exports = router;
