/*
eslint
no-multi-spaces: ["error", {exceptions: {"VariableDeclarator": true}}]
padded-blocks: ["error", {"classes": "always"}]
max-len: ["error", 80]
*/
'use strict'

const express     = require('express')
const request     = require('supertest')
const bodyParser  = require('body-parser')
const Joi         = require('joi')
const mocha       = require('mocha')

const it        = mocha.it
const describe  = mocha.describe
const before    = mocha.before

const validateSchema = require('./')

const app = express()

const someSchema = Joi.object().keys(
  {
    id: Joi.number().positive().required()
  }
)

const headersSchema = Joi.object().keys(
  {
    host: Joi.string(),
    'accept-encoding': Joi.string(),
    'user-agent': Joi.string(),
    id: Joi.number().positive().required(),
    connection: Joi.string().valid('close')
  }
)

describe('express midlleware schema validator', () => {

  describe('request', () => {

    before((done) => {
      let router = express.Router()

      // query string endpoint
      router.get(
        '/querystring',
        validateSchema().query(someSchema),
        (req, res) => { res.send('query string') }
      )

      // params endpoint
      router.get(
        '/params/:id',
        validateSchema().params(someSchema),
        (req, res) => { res.send('params') }
      )

      // body endpoint
      router.post(
        '/body',
        validateSchema().body(someSchema),
        (req, res) => { res.send('body') }
      )

      // headers endpoint
      router.get(
        '/headers',
        validateSchema().headers(headersSchema),
        (req, res) => { res.send('headers') }
      )

      // using Joi.validate options
      router.get(
        '/allowunknown',
        validateSchema({allowUnknown: true}).query(someSchema),
        (req, res) => { res.send('`joi.validate` options') }
      )

      app.use(bodyParser.json())
      app.use('/request', router)

      done()
    })

    it('should throw a 400 when fails on the schema validation',
      (done) => {
        request(app)
          .get('/request/querystring?id=bad')
          .expect(
            400,
            'child "id" fails because ["id" must be a number]',
            done
          )
      }
    )

    it('should return a 200 when validating a valid param(s)', (done) => {
      request(app)
        .get('/request/params/123')
        .expect(200, 'params', done)
    })

    it('should return a 200 when validating a valid body', (done) => {
      request(app)
        .post('/request/body')
        .send({id: 123})
        .expect(200, 'body', done)
    })

    it('should return a 200 when validating a valid header(s)', (done) => {
      request(app)
        .get('/request/headers')
        .set('id', 123)
        .expect(200, 'headers', done)
    })

    it('should return a 200 when validating a valid query string', (done) => {
      request(app)
        .get('/request/querystring?id=123')
        .expect(200, 'query string', done)
    })

    it('should return a 200 when validating a valid param(s)', (done) => {
      request(app)
        .get('/request/params/123')
        .expect(200, 'params', done)
    })

    it('should return a 200 when validating a valid body', (done) => {
      request(app)
        .post('/request/body')
        .send({id: 123})
        .expect(200, 'body', done)
    })

    it('should return a 200 when validating a valid header(s)', (done) => {
      request(app)
        .get('/request/headers')
        .set('id', 123)
        .expect(200, 'headers', done)
    })

    it('should return a 200 when setting options for `joi.validate`',
      (done) => {
        request(app)
          .get('/request/allowunknown?id=123&hello=world')
          .expect(200, '`joi.validate` options', done)
      }
    )
  })

  describe('response', () => {

    before((done) => {
      let router = express.Router()

      router.get(
        '/good',
        validateSchema().response(someSchema),
        (req, res) => { res.send({id: 123}) }
      )

      router.get(
        '/bad',
        validateSchema().response(someSchema),
        (req, res) => { res.send({id: 'bad'}) }
      )

      app.use(bodyParser.json())
      app.use('/response', router)

      done()
    })

    it('should return a 200 for a valid response', (done) => {
      request(app)
        .get('/response/good')
        .expect(200, {id: 123}, done)
    })

    it('should throw a 500 for an invalid response', (done) => {
      request(app)
        .get('/response/bad')
        .expect(500, 'child "id" fails because ["id" must be a number]', done)

    })
  })
})
