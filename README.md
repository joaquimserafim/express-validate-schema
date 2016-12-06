# express-validate-schema



<a href="https://nodei.co/npm/express-validate-schema/"><img src="https://nodei.co/npm/express-validate-schema.png?downloads=true"></a>

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg?style=flat-square)](https://travis-ci.org/joaquimserafim/express-validate-schema)![Code Coverage 100%](https://img.shields.io/badge/code%20coverage-100%25-green.svg?style=flat-square)[![ISC License](https://img.shields.io/badge/license-ISC-blue.svg?style=flat-square)](https://github.com/joaquimserafim/express-validate-schema/blob/master/LICENSE)[![NodeJS](https://img.shields.io/badge/node-6.1.x-brightgreen.svg?style=flat-square)](https://github.com/joaquimserafim/express-validate-schema/blob/master/package.json#L52)

[![JavaScript Style Guide](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)


### api
`const validateSchema = require('express-validate-schema')`

each middleware should be define before your route function (see examples)

```js
route.get('/', validateSchema().query(query_schema), your_route_function)
```

**validating query string**
`validateSchema([joi options]).query(some joi schema)`

**validating params**
`validateSchema([joi options]).params(some joi schema)`

**validating body**
`validateSchema([joi options]).body(some joi schema)`

**validating headers**
`validateSchema([joi options]).headers(some joi schema)`

**validating response**
`validateSchema([joi options]).response(some joi schema)`



### example


```js
const express = require('express')
const validateSchema = require('express-validate-schema')

const app = express()

const router = express.Router()

// validating the querystring
router.get(
  '/querystring',
  validateSchema().query(someSchema),
  (req, res) => { res.send(someBody) }
)

// validating the params
router.get(
  '/params/:id',
  validateSchema().params(someSchema),
  (req, res) => { res.send(someBody) }
)

// validating the body
router.post(
  '/body',
  validateSchema().body(someSchema),
  (req, res) => { res.send(someBody) }
)

// validating the headers
router.get(
  '/headers',
  validateSchema().headers(headersSchema),
  (req, res) => { res.send(someBody) }
)

// validating params, body and header
router.put(
  '/someresouce/:id',
  validateSchema().params(someSchema),
  validateSchema()
    .body(Joi.object().keys({name: Joi.string().required()})),
  validateSchema({allowUnknown: true})
    .headers(Joi.object().keys({hello: Joi.string().required()})),
  (req, res) => { res.send('yay!') }
)

```





### ISC License (ISC)