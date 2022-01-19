import { Logger } from '@deepkit/logger'
import { http } from '@deepkit/http'
import { t } from '@deepkit/type'
import { asyncOperation } from '@deepkit/core'
import { RabbitMqConnector } from '../rabbitmq/RabbitMqConnector'

class RabbitMessage {
  @t.required text!: string
}

@http.controller('/api')
export class RabbitMqController {
  constructor(
    protected rabbit: RabbitMqConnector, protected logger: Logger,
  ) {
    this.logger = this.logger.scoped('rabbit-api')
  }

  @http.POST(`rabbit-connect`)
  async rabbitConnect() {
    const connState = await this.rabbit.connect('rnode-import')

    return connState
  }

  @http.POST(`rabbit-init-publisher`)
  async rabbitInitPublisher() {
    const pState = await this.rabbit.initPublisher()

    return pState
  }

  @http.POST(`rabbit-init-consumer`)
  async rabbitInitConsumer() {
    const cState = this.rabbit.initConsumer(async msg =>
      this.logger.log(`Consume message`, msg.content.toString())
    )
    return cState
  }

  @http.POST(`rabbit-send`)
  async rabbitSend(@http.body() body: RabbitMessage) {
    if (body.text.trim() === '')
      throw new Error(`Message text must not be empty`)

    return this.rabbit.sendMessage(Buffer.from(body.text))
  }
}
