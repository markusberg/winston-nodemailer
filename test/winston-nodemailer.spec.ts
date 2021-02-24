import * as winston from 'winston'

import { SMTPServer } from 'smtp-server'
import { WinstonNodemailer } from '../lib/winston-nodemailer'

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
  beforeAll((done) => {
    smtpServer = new SMTPServer({
      closeTimeout: 500,
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
          stream.destroy()
        })
      },
    })

    smtpServer.listen(port, '0.0.0.0', () => {
      done()
    })
  })

  afterAll((done) => {
    smtpServer.close(() => {
      done()
    })
  })

  beforeEach(() => {
    winston.clear()
    emails = []
  })

  it('should send an email', async () => {
    winston.add(
      new WinstonNodemailer({
        debounce: 10,
        host: 'localhost',
        port,
        to,
      }),
    )

    winston.error('OMGZ ERROR!')
    await delay(300)
    expect(emails).toHaveLength(1)
  })

  it('should stay silent', async () => {
    winston.add(
      new WinstonNodemailer({
        debounce: 10,
        host: 'localhost',
        port,
        silent: true,
        to,
      }),
    )

    winston.error('Shut up Winston!')
    await delay(300)
    expect(emails).toHaveLength(0)
  })

  it('should debounce into one email', async () => {
    winston.add(
      new WinstonNodemailer({
        debounce: 10,
        host: 'localhost',
        port,
        to,
      }),
    )

    winston.error('First error')
    winston.error('Second error')

    await delay(300)

    expect(emails).toHaveLength(1)
    expect(emails[0]).toContain('First error')
    expect(emails[0]).toContain('Second error')
  })

  it('should split into two emails', async () => {
    winston.add(
      new WinstonNodemailer({
        debounce: 25,
        host: 'localhost',
        port,
        to,
      }),
    )

    winston.error('First error')
    await delay(50)
    winston.error('Second error')
    await delay(300)

    expect(emails).toHaveLength(2)
    expect(emails[0]).toContain('First error')
    expect(emails[1]).toContain('Second error')
  })

  it('should only listen to logs of its configured level', async () => {
    winston.add(
      new WinstonNodemailer({
        debounce: 25,
        host: 'localhost',
        port,
        to,
      }),
    )

    winston.info('This is an info-level log')
    await delay(50)
    expect(emails).toHaveLength(0)
  })
})
