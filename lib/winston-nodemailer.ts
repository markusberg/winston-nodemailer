import { GenericTransportOptions, Transport, TransportInstance, log, transports } from 'winston'
import { SendMailOptions, Transporter, createTransport } from 'nodemailer'

import { SmtpOptions } from 'nodemailer-smtp-transport'

export interface WinstonNodemailerOptions extends GenericTransportOptions, SendMailOptions, SmtpOptions {
  debounce?: number
  timestamp?: Function
}

export class WinstonNodemailer extends Transport implements TransportInstance {
  private debounce: number
  private messageBuffer: string[]
  private timestamp: Function
  private transporter: Transporter
  private triggered: NodeJS.Timer

  constructor (private options: WinstonNodemailerOptions) {
    super()

    this.level = options.level || 'error'
    this.name = 'nodemailer'

    this.debounce = options.debounce || 60000
    this.timestamp = options.timestamp || (() => (new Date).toISOString())

    this.messageBuffer = []

    this.transporter = createTransport(options)
  }

  private sendMail (callback: Function) {
    this.transporter
      .sendMail(Object.assign({
        text: this.messageBuffer.join('')
      }, this.options))
      .then(res => {
        this.emit('logged')
        callback(null, true)
      })
      .catch(err => {
        this.emit('error', err)
      })

    this.messageBuffer = []
    delete this.triggered
  }

  log (level: string, msg: string, meta: object, callback: Function) {
    if (this.silent) {
      return callback(null, true)
    }

    const buildMessage = () => {
      return `${this.timestamp()} - ${msg}\n${JSON.stringify(meta, null, 4)}\n\n`
    }

    this.messageBuffer.push(buildMessage())

    if (!this.triggered) {
      this.triggered = setTimeout(() => {
        this.sendMail(callback)
      }, this.debounce)
    }
  }
}
