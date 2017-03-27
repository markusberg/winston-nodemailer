import * as winston from 'winston'

import { SMTPServer } from 'smtp-server'
import { WinstonNodemailer } from '../lib/winston-nodemailer'
import { expect } from 'chai'

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })
}

let smtpServer: SMTPServer
let emails: any[]

describe('winston-nodemailer', () => {
  before((done: MochaDone) => {
    smtpServer = new SMTPServer({
      disabledCommands: ['AUTH', 'STARTTLS'],
      onData: (stream, session, cb) => {
        let msg = ''
        stream.on('data', (chunk: any) => {
          chunk = (new Buffer(chunk)).toString()
          msg += chunk
        })
        stream.on('error', cb)
        stream.on('end', () => {
          emails.push(msg)
        })
      },
    })

    smtpServer.listen(2500, '0.0.0.0', (err: Error) => {
      done(err)
    })
  })

  beforeEach(() => {
    emails = []
  })

  it('should send an email', async () => {
    winston.configure({
      transports: [
        new WinstonNodemailer({
          debounce: 10,
          host: 'localhost',
          port: 2500,
          to: 'lucy@thesky.com',
        }),
      ],
    })

    winston.error('OMGZ ERROR!')

    await delay(300)

    expect(emails).to.have.length(1)
  })

  it('should stay silent', async () => {
    winston.configure({
      transports: [
        new WinstonNodemailer({
          debounce: 10,
          host: 'localhost',
          port: 2500,
          silent: true,
          to: 'lucy@thesky.com',
        }),
      ],
    })

    winston.error('Shut up Winston!')

    await delay(300)

    expect(emails).to.have.length(0)
  })

  it('should debounce into one email', async () => {
    winston.configure({
      transports: [
        new WinstonNodemailer({
          debounce: 10,
          host: 'localhost',
          port: 2500,
          to: 'lucy@thesky.com',
        }),
      ],
    })

    winston.error('First error')
    winston.error('Second error')

    await delay(300)

    expect(emails).to.have.length(1)
    expect(emails[0])
      .to.contain('First error')
      .and.to.contain('Second error')
  })

  it('should split into two emails', async () => {
    winston.configure({
      transports: [
        new WinstonNodemailer({
          debounce: 25,
          host: 'localhost',
          port: 2500,
          to: 'lucy@thesky.com',
        }),
      ],
    })

    winston.error('First error')

    await delay(50)

    winston.error('Second error')

    await delay(300)

    expect(emails).to.have.length(2)
    expect(emails[0]).to.contain('First error')
    expect(emails[1]).to.contain('Second error')
  })
})
