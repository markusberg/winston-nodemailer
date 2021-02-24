import { LogCallback } from 'winston'
import * as Transport from 'winston-transport'
import { SendMailOptions, Transporter, createTransport } from 'nodemailer'
import { SmtpOptions } from 'nodemailer-smtp-transport'

export interface IWinstonNodemailerOptions
  extends Transport.TransportStreamOptions,
    SendMailOptions,
    SmtpOptions {
  debounce?: number
}

export class WinstonNodemailer extends Transport {
  private debounce: number
  private messageBuffer: string[]
  private transporter: Transporter
  private isBuffering?: NodeJS.Timer

  constructor(private options: IWinstonNodemailerOptions) {
    super(options)

    this.debounce = options.debounce || 60000
    this.messageBuffer = []

    this.transporter = createTransport(options)
  }

  public log(info: any, callback: LogCallback) {
    setImmediate(() => {
      this.emit('logged', info)
    })

    this.messageBuffer.push(info.message)

    if (!this.isBuffering) {
      this.isBuffering = setTimeout(() => {
        const email = {
          ...this.options,
          text: this.messageBuffer.join('\n\n'),
        } as SendMailOptions

        this.transporter.sendMail(email).catch(() => {})
        this.messageBuffer = []
        delete this.isBuffering
      }, this.debounce)
    }

    callback()
  }
}
