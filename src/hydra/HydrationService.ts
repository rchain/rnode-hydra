import { injectable } from '@deepkit/injector'
import { t } from '@deepkit/type'
import { Logger } from '@deepkit/logger'
import { RNodeConnector } from '../rchain/RNodeConnector'
import { RabbitMqConnector } from '../rabbitmq/RabbitMqConnector'

const enum HydraState {
  Ready = 'ready',
  Starting = 'starting',
  Uninitialized = 'uninitialized',
}

export class HydraMessage {
  @t.required data!: string
}

@injectable
export class HydrationService {
  state: HydraState = HydraState.Uninitialized

  constructor(protected logger: Logger, protected rnode: RNodeConnector, protected rabbit: RabbitMqConnector) {
    this.logger = this.logger.scoped('hydra-service')
  }

  async init() {
    if (this.state === HydraState.Uninitialized) {
      // Set starting state
      this.state = HydraState.Starting

      // Initialize RabbitMQ
      await this.rabbit.connect('rnode-import')
      await this.rabbit.initPublisher()

      await this.rabbit.initConsumer(async msg => {
        // Send message to RNode
        const sig = await this.rnode.deploy(`
          new return(\`rho:rchain:deployId\`) in {
            return!(${msg.content})
          }
        `)

        await this.rnode.propose()

        // const result = await this.rnode.getDepoloyData(sig)

        this.logger.log(`Queue meesage processed`)
      })
      // Set ready state
      this.state = HydraState.Ready
    }
    return this.state
  }

  pushData(msg: HydraMessage) {
    return this.rabbit.sendMessage(Buffer.from(msg.data))
  }
}
