# @rappestad/winston-nodemailer

A [nodemailer](https://www.npmjs.com/package/nodemailer) transport for [winston](https://www.npmjs.com/package/winston)

This is a forked version with support for Winston v3. Make use of the winston.format functionality
to format the email messages.

[![npm (scoped)](https://img.shields.io/npm/v/@rappestad/winston-nodemailer.svg)](https://www.npmjs.com/package/@rappestad/winston-nodemailer)
[![license](https://img.shields.io/github/license/rappestad/winston-nodemailer.svg)](https://github.com/rappestad/winston-nodemailer/blob/master/LICENSE)
[![Build Status](https://img.shields.io/travis/rappestad/winston-nodemailer.svg)](https://travis-ci.org/rappestad/winston-nodemailer)
[![Coverage Status](https://img.shields.io/coveralls/rappestad/winston-nodemailer.svg)](https://coveralls.io/github/rappestad/winston-nodemailer?branch=master)
[![David](https://img.shields.io/david/peer/rappestad/winston-nodemailer.svg)]()
[![David](https://img.shields.io/david/dev/rappestad/winston-nodemailer.svg)]()

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
      timestamp: () => new Date().toLocaleTimeString(),
      colorize: true,
      level: 'debug',
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
      debounce: 1000,

      // format the log message
      format: winston.format.simple(),
    }),
  ],
})
```
