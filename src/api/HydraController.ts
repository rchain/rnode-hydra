import { Logger } from '@deepkit/logger'
import { http } from '@deepkit/http'
import { asyncOperation } from '@deepkit/core'
import { singleStack } from '@deepkit/core'
import { HydraMessage, HydrationService } from '../hydra/HydrationService'

@http.controller('/api')
export class HydraController {
  constructor(
    protected hydra: HydrationService,
    protected logger: Logger,
  ) {
    this.logger = this.logger.scoped('hydra-api')
  }

  @http.POST(`init`).description(`Initializes hydration service (RabbitMQ publisher/consumer)`)
  async init() {
    // Initialize hydra service
    const hydraState = await this.hydra.init()

    this.logger.log(`Hydration service`, hydraState)

    return hydraState
  }

  @singleStack()
  sleep(ms: number) {
    return asyncOperation<void>(resolve => {
      this.logger.log(`Sleep start`)
      setTimeout(() => {
        resolve()
        this.logger.log(`Sleep end`)
      }, ms)
    })
  }

  @http.POST(`send`).description(`Sends data to RabbitMQ which is consumed and pushed to RNode`)
  async send(@http.body() body: HydraMessage) {
    if (body.data.trim() === '')
      throw new Error(`Message text must not be empty`)

    return this.hydra.pushData(body)
  }
}
