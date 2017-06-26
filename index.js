/*
eslint
no-multi-spaces: ["error", {exceptions: {"VariableDeclarator": true}}]
padded-blocks: ["error", {"classes": "always"}]
max-len: ["error", 80]
*/
'use strict'

const Joi     = require('joi')
const between = require('between-range')

class ValidateSchema {

  constructor (options = {}) {
    this._validationOptions = options.validationOptions
    this._prcHttpCallOnError = options.processHttpCallOnError === true
  }

  query (schema) {
    return procRequest.bind(this, 'query', schema)
  }

  params (schema) {
    return procRequest.bind(this, 'params', schema)
  }

  body (schema) {
    return procRequest.bind(this, 'body', schema)
  }

  headers (schema) {
    return procRequest.bind(this, 'headers', schema)
  }

  response (schema) {
    return procResponse.bind(this, schema)
  }

}

module.exports = function factory (options) {
  return new ValidateSchema(options)
}

//
// internal functions
//

function procRequest (type, schema, req, res, next) {
  const prcHttpCallOnError = this._prcHttpCallOnError
  const options = this._validationOptions

  Joi.validate(req[type], schema, options, validateRequest)

  function validateRequest (err, value) {
    return err
      ? prcHttpCallOnError
        ? res.status(400).send(err.message)
        : res.status(400) && next(err)
      : (req[type] = value) && next()
  }
}

function procResponse (schema, req, res, next) {
  res._json = res.json
  res.json = jsonMethodOverride

  const prcHttpCallOnError = this._prcHttpCallOnError
  const options = this._validationOptions

  next()

  function jsonMethodOverride (body) {

    return isHttpError(res.statusCode)
      ? res._json(body)
      : Joi.validate(body, schema, options, validateResponse)

    function validateResponse (err) {

      return err
        ? prcHttpCallOnError
          ? res.status(500).end(err.message)
          : res.status(500) && next(err)
        : res._json(body)
    }
  }
}

//
// supports official and unofficial codes
//

function isHttpError (statusCode) {
  return between(statusCode, 400, 599)
}
