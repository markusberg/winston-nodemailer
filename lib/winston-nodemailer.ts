import { GenericTransportOptions, LogCallback, Transport, TransportInstance, log, transports } from 'winston'
import { SendMailOptions, Transporter, createTransport } from 'nodemailer'

import { SmtpOptions } from 'nodemailer-smtp-transport'

export interface IWinstonNodemailerOptions extends GenericTransportOptions, SendMailOptions, SmtpOptions {
  debounce?: number
  timestamp?: () => string
}

export class WinstonNodemailer extends Transport implements TransportInstance {
  private debounce: number
  private messageBuffer: string[]
  private timestamp: () => string
  private transporter: Transporter
  private triggered: NodeJS.Timer

  constructor(private options: IWinstonNodemailerOptions) {
    super()

    this.level = options.level || 'error'
    this.name = 'nodemailer'
    this.silent = !!options.silent

    this.debounce = options.debounce || 60000
    this.timestamp = options.timestamp || (() => (new Date()).toISOString())

    this.messageBuffer = []

    this.transporter = createTransport(options)
  }

  public log(level: string, msg: string, meta: object, callback: LogCallback) {
    if (this.silent) {
      return callback(null, undefined)
    }

    this.messageBuffer.push(`${this.timestamp()} - ${msg}\n${JSON.stringify(meta, null, 4)}\n\n`)

    if (!this.triggered) {
      this.triggered = setTimeout(() => {
        this.sendMail(callback)
      }, this.debounce)
    }
  }

  private sendMail(callback: LogCallback) {
    this.transporter
      .sendMail({
        ...this.options,
        text: this.messageBuffer.join(''),
      } as SendMailOptions)

    this.messageBuffer = []
    delete this.triggered
  }
}
