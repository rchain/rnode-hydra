import { injectable } from '@deepkit/injector'
import { singleStack } from '@deepkit/core'
import { Logger } from '@deepkit/logger'

import amqplib from 'amqplib'
import { AppConfig } from '../config/app-config'

class RabbitMqConfig extends AppConfig.slice('rabbitHost') { }

const enum ConnectionState {
  Closed = 'closed',
  Open = 'open',
  Opening = 'opening',
  Closing = 'closing',
  Error = 'error',
}

const enum ChannelState {
  Closed = 'closed',
  Open = 'open',
  Opening = 'opening',
  Closing = 'closing',
  Error = 'error',
}

@injectable
export class RabbitMqConnector {
  connState: ConnectionState = ConnectionState.Closed
  publisherState: ChannelState = ChannelState.Closed
  consumerState: ChannelState = ChannelState.Closed

  queue?: string

  protected rabbit?: amqplib.Connection
  protected publishCh?: amqplib.Channel
  protected consumeCh?: amqplib.Channel
  protected consumeTag?: string

  constructor(protected logger: Logger, protected config: RabbitMqConfig) {
    this.logger = this.logger.scoped('rabbit-connector')
  }

  sendMessage(msg: Buffer) {
    this.checkPublisherReady()

    return this.publishCh!.sendToQueue(this.queue!, msg)
  }

  @singleStack()
  async connect(queue: string) {
    if (this.connState === ConnectionState.Closed) {
      this.connState = ConnectionState.Opening
      this.queue = queue
      this.rabbit = await amqplib.connect(this.config.rabbitHost)
      this.connState = ConnectionState.Open
    }
    return this.connState
  }

  private checkConnOpen() {
    if (this.connState !== ConnectionState.Open)
      throw new Error(`RabbitMQ connection is not open (${this.connState}). Did you forgot to connect first?`)
  }

  private checkPublisherReady() {
    if (this.publisherState !== ChannelState.Open)
      throw new Error(`Publisher not ready (${this.publisherState}). Did you forgot to initialize publisher first?`)
  }

  private checkConsumerReady() {
    if (this.consumerState !== ChannelState.Open)
      throw new Error(`Consumer not ready (${this.consumerState}). Did you forgot to initialize consumer first?`)
  }

  @singleStack()
  async initPublisher() {
    this.checkConnOpen()

    // Publisher
    if (this.publisherState === ChannelState.Closed) {
      this.publisherState = ChannelState.Opening
      this.publishCh = await this.rabbit!.createChannel()
      const _ = await this.publishCh.assertQueue(this.queue!)
      this.publisherState = ChannelState.Open
    }
    return this.publisherState
  }

  @singleStack()
  async initConsumer(c: (msg: amqplib.ConsumeMessage) => Promise<void>) {
    this.checkConnOpen()

    // Consumer
    if (this.consumerState === ChannelState.Closed) {
      this.consumerState = ChannelState.Opening
      this.consumeCh = await this.rabbit!.createChannel()
      const _ = await this.consumeCh.assertQueue(this.queue!)

      const consume = await this.consumeCh.consume(this.queue!, msg => {
        if (msg !== null) {
          c(msg).then(_ => this.consumeCh!.ack(msg))
        }
      })
      this.consumeTag = consume.consumerTag
      this.consumerState = ChannelState.Open
    }
    return this.consumerState
  }
}
