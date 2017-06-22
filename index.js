/*
eslint
no-multi-spaces: ["error", {exceptions: {"VariableDeclarator": true}}]
padded-blocks: ["error", {"classes": "always"}]
max-len: ["error", 80]
*/
'use strict'

const Joi     = require('joi')
const apply   = require('node-apply')
const between = require('between-range')

module.exports = ValidateSchema

function ValidateSchema (options) {
  if (!(this instanceof ValidateSchema)) {
    return new ValidateSchema(options)
  }

  this._options = options
}

ValidateSchema.prototype.query = function query (schema) {
  return apply(procRequest, 'query', this._options, schema)
}

ValidateSchema.prototype.params = function params (schema) {
  return apply(procRequest, 'params', this._options, schema)
}

ValidateSchema.prototype.body = function body (schema) {
  return apply(procRequest, 'body', this._options, schema)
}

ValidateSchema.prototype.headers = function headers (schema) {
  return apply(procRequest, 'headers', this._options, schema)
}

ValidateSchema.prototype.response = function response (schema) {
  return apply(procResponse, this._options, schema)
}

//
// internal functions
//

function procRequest (type, options, schema, req, res, next) {

  Joi.validate(req[type], schema, options, validateRequest)

  function validateRequest (err, value) {
    return err
      ? res.status(400) && next(err)
      : (req[type] = value) && next()
  }
}

function procResponse (options, schema, req, res, next) {
  res._json = res.json
  res.json = jsonMethodOverride

  function jsonMethodOverride (body) {

    return isHttpError(res.statusCode)
      ? res._json(body)
      : Joi.validate(body, schema, options, validateResponse)

    function validateResponse (err) {

      return err
        ? res.status(500).end(err.message)
        : res._json(body)
    }
  }

  next()
}

//
// supports official and unofficial code
//

function isHttpError (statusCode) {
  return between(statusCode, 400, 599)
}
