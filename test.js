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
      const router = express.Router()

      // query string endpoint
      router.get(
        '/querystring',
        validateSchema({ processHttpCallOnError: true }).query(someSchema),
        (req, res) => { res.send('query string') }
      )

      // params endpoint
      router.get(
        '/params/:id',
        validateSchema({ processHttpCallOnError: true }).params(someSchema),
        (req, res) => { res.send('params') }
      )

      // body endpoint
      router.post(
        '/body',
        validateSchema({ processHttpCallOnError: true }).body(someSchema),
        (req, res) => { res.send('body') }
      )

      // headers endpoint
      router.get(
        '/headers',
        validateSchema({ processHttpCallOnError: true })
          .headers(headersSchema),
        (req, res) => { res.send('headers') }
      )

      // using Joi.validate options
      router.get(
        '/joi.validate',
        validateSchema(
          {
            validationOptions: { allowUnknown: true },
            processHttpCallOnError: true
          }
        )
          .query(someSchema),
        (req, res) => { res.send('`joi.validate` options') }
      )

      // multiple validations
      router.put(
        '/someresouce/:id',
        validateSchema({ processHttpCallOnError: true }).params(someSchema),
        validateSchema({ processHttpCallOnError: true })
          .body(Joi.object().keys({ name: Joi.string().required() })),
        validateSchema(
          {
            validationOptions: { allowUnknown: true },
            processHttpCallOnError: false
          }
        )
          .headers(Joi.object().keys({ hello: Joi.string().required() })),
        (req, res) => { res.send('yay!') }
      )

      // when with an error middleware
      router.get(
        '/middleware123',
        validateSchema().query(someSchema),
        (req, res) => { res.send('yay!') }
      )

      app.use(bodyParser.json())
      app.use('/request', router)
      app.use((err, req, res, next) => res.send(err.message))

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
        .send({ id: 123 })
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

    it('should return a 200 when using `joi.validate` options',
      (done) => {
        request(app)
          .get('/request/joi.validate?id=123&hello=world')
          .expect(200, '`joi.validate` options', done)
      }
    )

    it('should throw a 400 when fail in one of the validations',
      (done) => {
        request(app)
          .put('/request/someresouce/123')
          .set('hello', 'world')
          .send({ name: 123 })
          .expect(
            400,
            'child "name" fails because ["name" must be a string]',
            done
          )
      }
    )

    it('should return a 200 when doing various validations',
      (done) => {
        request(app)
          .put('/request/someresouce/123')
          .set('hello', 'world')
          .send({ name: 'Joe Doe' })
          .expect(200, 'yay!', done)
      }
    )

    it('should return a 400 through a middleware error when setting' +
      ' `processHttpCallOnError` to false',
      (done) => {
        request(app)
          .get('/request/middleware123')
          .expect(400, 'child "id" fails because ["id" is required]', done)
      }
    )
  })

  describe('response', () => {

    before((done) => {
      const router = express.Router()

      router.get(
        '/good',
        validateSchema({ processHttpCallOnError: true })
          .response(someSchema),
        (req, res) => { res.send({id: 123}) }
      )

      router.get(
        '/processhttpcallimmediate',
        validateSchema({ processHttpCallOnError: true })
          .response(Joi.object().keys({ value: 'ok' })),
        (req, res) => { res.send({id: 123}) }
      )

      router.get(
        '/bad',
        validateSchema({ processHttpCallOnError: false })
          .response(someSchema),
        (req, res) => { res.send({id: 'bad'}) }
      )

      router.get(
        '/502',
        validateSchema({ processHttpCallOnError: true })
          .response(someSchema),
        (req, res) => { res.status(502).send({message: 'alarm!!!'}) }
      )

      app.use(bodyParser.json())
      app.use('/response', router)
      app.use((err, req, res, next) => res.send(err.message))

      done()
    })

    it('should follow the server normal behaviour when an ' +
      'error happens (server logic) 4.x.x / 5.x.x without json response',
      (done) => {
        request(app)
          .get('/response/dontexists')
          .expect(404, done)
      }
    )

    it('should follow the server normal behaviour when an ' +
      'error happens (server logic) 4.x.x / 5.x.x with a json response',
      (done) => {
        request(app)
          .get('/response/502')
          .expect(502, { message: 'alarm!!!' }, done)
      }
    )

    it('should throw a 500 for an invalid response', (done) => {
      request(app)
        .get('/response/processhttpcallimmediate')
        .expect(500, '"id" is not allowed', done)
    })

    it('should throw a 500 for an invalid response', (done) => {
      request(app)
        .get('/response/bad')
        .expect(500, 'child "id" fails because ["id" must be a number]', done)
    })

    it('should return a 200 for a valid response', (done) => {
      request(app)
        .get('/response/good')
        .expect(200, { id: 123 }, done)
    })
  })
})
