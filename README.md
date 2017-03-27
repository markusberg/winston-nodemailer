# @rappestad/winston-nodemailer
A [nodemailer](https://www.npmjs.com/package/nodemailer) transport for winston

[![Build Status](https://travis-ci.org/rappestad/winston-nodemailer.svg?branch=master)](https://travis-ci.org/rappestad/winston-nodemailer)
[![Coverage Status](https://coveralls.io/repos/github/rappestad/winston-nodemailer/badge.svg?branch=master)](https://coveralls.io/github/rappestad/winston-nodemailer?branch=master)

## Installation
Install the module and the typescript definitions:
```bash
npm install winston --save
npm install @rappestad/winston-nodemailer --save
```

## Example
```typescript
import * as winston from 'winston'
import { WinstonNodemailer } from '@rappestad/winston-nodemailer'

winston.configure({
  transports: [
    // log to console
    new winston.transports.Console({
      timestamp: () => (new Date()).toLocaleTimeString(),
      colorize: true,
      level: 'debug'
    }),

    // log to email
    new WinstonNodemailer({
      // check nodemailer for options available for the smtp transport
      host: 'example.com',
      port: 25,
      to: 'example@example.com',
      from: '"Winston" <noreply@example.com>',
      subject: 'Oi, here are some log entries!',

      // default: 'error'
      level: 'warn',

      // wait for additional log entries for 1000 ms
      // before sending the email
      // default: 60000 (1 minute)
      debounce: 1000
    })
  ]
})
```
