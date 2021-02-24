import { LogCallback } from 'winston'
import * as Transport from 'winston-transport'

import { SendMailOptions, Transporter, createTransport } from 'nodemailer'

import { SmtpOptions } from 'nodemailer-smtp-transport'

export interface IWinstonNodemailerOptions
  extends SendMailOptions,
    SmtpOptions {
  level?: string
  debounce?: number
  timestamp?: () => string
  silent?: boolean
}

export class WinstonNodemailer extends Transport {
  private debounce: number
  private messageBuffer: string[]
  private timestamp: () => string
  private transporter: Transporter
  private isBuffering?: NodeJS.Timer

  level: string
  name: string
  silent: boolean

  constructor(private options: IWinstonNodemailerOptions) {
    super(options)

    this.level = options.level || 'error'
    this.name = 'nodemailer'
    this.silent = !!options.silent

    this.debounce = options.debounce || 60000
    this.timestamp = options.timestamp || (() => new Date().toISOString())

    this.messageBuffer = []

    this.transporter = createTransport(options)
  }

  public log(info: any, callback: LogCallback) {
    setImmediate(() => {
      this.emit('logged', info)
    })

    if (this.silent) {
      return callback(null, undefined)
    }

    this.messageBuffer.push(`${this.timestamp()} - ${info.message}\n\n`)

    if (!this.isBuffering) {
      this.isBuffering = setTimeout(() => {
        this.transporter.sendMail({
          ...this.options,
          text: this.messageBuffer.join(''),
        } as SendMailOptions)
        this.messageBuffer = []
        delete this.isBuffering
      }, this.debounce)
    }

    callback()
  }
}
