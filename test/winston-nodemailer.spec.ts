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
const port = 2500
const to = 'lucy@example.com'

describe('winston-nodemailer', () => {
  before((done: Mocha.Done) => {
    smtpServer = new SMTPServer({
      disabledCommands: ['AUTH', 'STARTTLS'],
      onData: (stream, _session, cb) => {
        let msg = ''
        stream.on('data', (chunk: any) => {
          chunk = Buffer.from(chunk).toString()
          msg += chunk
        })
        stream.on('error', cb)
        stream.on('end', () => {
          emails.push(msg)
        })
      },
    })

    smtpServer.listen(port, '0.0.0.0', () => {
      done()
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
          port,
          to,
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
          port,
          silent: true,
          to,
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
          port,
          to,
        }),
      ],
    })

    winston.error('First error')
    winston.error('Second error')

    await delay(300)

    expect(emails).to.have.length(1)
    expect(emails[0]).to.contain('First error').and.to.contain('Second error')
  })

  it('should split into two emails', async () => {
    winston.configure({
      transports: [
        new WinstonNodemailer({
          debounce: 25,
          host: 'localhost',
          port,
          to,
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
