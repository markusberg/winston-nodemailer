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
      closeTimeout: 50,
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
    smtpServer.close()
    done()
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

    expect(emails).toHaveLength(1)
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

    expect(emails).toHaveLength(0)
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

    expect(emails).toHaveLength(1)
    expect(emails[0]).toContain('First error')
    expect(emails[0]).toContain('Second error')
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

    expect(emails).toHaveLength(2)
    expect(emails[0]).toContain('First error')
    expect(emails[1]).toContain('Second error')
  })

  it('should suppress all logs on silent', async () => {
    winston.configure({
      transports: [
        new WinstonNodemailer({
          silent: true,
          debounce: 25,
          host: 'localhost',
          port,
          to,
        }),
      ],
    })

    winston.error('First error')
    winston.error('Second error')

    await delay(50)

    expect(emails).toHaveLength(0)
  })
})
