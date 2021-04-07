var express = require('express');
var _ = require('lodash');
var router = express.Router();
var db = require('../database.js');

// /!\ TODO USE REAL ORM FOR PREVENTING SQL INJECTION

const getValue = (v) => {
  if (['true', 'false', 'null'].includes(v)) {
    return v.toUpperCase();
  }
  return `"${v}"`;
};

const getOperator = (v) => {
  // TODO handle number
  // review
  if (['true', 'false', 'null'].includes(v)) {
    return 'is';
  }
  return '=';
}

/* GET users listing. */
router.get('/', function(req, res, next) {
  // TODO handle negative page/limit, handle count/end
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 5;
  const skipIndex = (page - 1) * limit;

  // remove for dealing with filters
  delete req.query.page;
  delete req.query.limit;

  let sql = "select * from users";
  let count = "select count(*) as c from users";

  const {search} = req.query;
  delete req.query.search;

  const query = req.query;

  let where = '';
  if (!_.isEmpty(query) || !_.isEmpty(search)) {
    where += ' where';
  }

  if (!_.isEmpty(search)) {
    where += ` name COLLATE NOACCENTS like '%${search}%' COLLATE NOACCENTS or username COLLATE NOACCENTS like '%${search}%' COLLATE NOACCENTS`;
  }

  if (!_.isEmpty(query)) {
    // TODO use dedicated filter + use whitelist
    Object.entries(query).forEach(([k, v], i) => {
      where += ` ${i > 0 ? 'and' : ''}"${k}" ${getOperator(v)} ${getValue(v)}`;
    });
  }
  count += where;
  sql += where + ' limit ? offset ?';
  const params = [limit, skipIndex];
  db.all(sql, params, (err, rows) => {
    db.get(count, [], (err, row) => {
      if (err) {
        res.status(400).json({'error': err.message});
        return;
      }

      res.json({
        'message': 'success',
        'data': rows,
        'count': row.c,
      })
    });
  });
});

router.get('/:id', (req, res, next) => {
  const sql = "select * from users where id = ?";
  const params = [req.params.id];
  db.get(sql, params, (err, row) => {
    if (err) {
      res.status(400).json({'error': err.message});
      return;
    }
    res.json({
      'message': 'success',
      'data': row
    })
  });
});

router.get('/:id/softdelete', (req, res, next) => {
  const sql = "update users set isDeleted = TRUE where id = ?";
  const params = [req.params.id];
  db.run(sql, params, (err) => {
    if (err) {
      res.status(400).json({'error': err.message});
      return;
    }
    res.json({
      'message': 'success',
    })
  });
});

router.get('/:id/reactivate', (req, res, next) => {
  const sql = "update users set isDeleted = null where id = ?"; // TODO null or false?
  const params = [req.params.id];
  db.run(sql, params, (err) => {
    if (err) {
      res.status(400).json({'error': err.message});
      return;
    }
    res.json({
      'message': 'success',
    })
  });
});

router.get('/:id/messages', (req, res, next) => {
  const sql = "select * from messages where senderId = ? or receiverId = ?";
  const params = [req.params.id];
  db.all(sql, params, (err, rows) => {
    if (err) {
      res.status(400).json({'error': err.message});
      return;
    }
    res.json({
      'message': 'success',
      'data': rows
    })
  });
});

router.get('/:id/medias', (req, res, next) => {
  const sql = "select * from media where userId = ?";
  const params = [req.params.id];
  db.all(sql, params, (err, rows) => {
    if (err) {
      res.status(400).json({'error': err.message});
      return;
    }
    res.json({
      'message': 'success',
      'data': rows
    })
  });
});

module.exports = router;
