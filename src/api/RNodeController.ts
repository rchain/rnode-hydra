import { Logger } from '@deepkit/logger'
import { http } from '@deepkit/http'
import { t } from '@deepkit/type'
import { asyncOperation } from '@deepkit/core'
import { RNodeConnector } from '../rchain/RNodeConnector'

class RNodeMessage {
  @t.required data!: string
}

@http.controller('/api')
export class RNodeController {
  constructor(
    protected rnode: RNodeConnector, protected logger: Logger,
  ) {
    this.logger = this.logger.scoped('rnode-api')
  }

  @http.POST(`rnode-send`)
  async send(@http.body() body: RNodeMessage) {
    const sig = await this.rnode.deploy(`
      new return(\`rho:rchain:deployId\`) in {
        return!(${body.data})
      }
    `)

    return Buffer.from(sig).toString('hex')
  }

  @http.POST(`rnode-send-propose-result`)
  async sendProposeGetResult(@http.body() body: RNodeMessage) {
    const sig = await this.rnode.deploy(`
      new return(\`rho:rchain:deployId\`) in {
        return!(${body.data})
      }
    `)

    await this.rnode.propose()

    const result = await this.rnode.getDepoloyData(sig)

    return result
  }
}
