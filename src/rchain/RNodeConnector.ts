import { injectable } from '@deepkit/injector'
import { singleStack } from '@deepkit/core'
import { Logger } from '@deepkit/logger'

import * as grpcLib from '@grpc/grpc-js'
import { ec } from 'elliptic'

// Generated files with rnode-grpc-js tool
import protoSchema from '../../rnode-grpc-gen/js/pbjs_generated.json'
// Import generated protobuf types (in global scope)
import '../../rnode-grpc-gen/js/DeployServiceV1_pb'
import '../../rnode-grpc-gen/js/ProposeServiceV1_pb'

// RNode gRPC client
import * as _ from "../../rnode-grpc-gen/js/rnode-grpc-js" // Generated TypeScript definitions
import { rnodeDeploy, rnodePropose, signDeploy, verifyDeploy, rhoParToJson, Options } from '@tgrospic/rnode-grpc-js'

import { AppConfig } from '../config/app-config'

class RNodeConfig extends AppConfig.slice('rnodeHost') { }

const enum ProposeState {
  Idle = 'idle',
  InProgress = 'in-progress',
  Required = 'required',
}

@injectable
export class RNodeConnector {
  readonly options: Options

  proposeState = ProposeState.Idle

  constructor(protected logger: Logger, protected config: RNodeConfig) {
    this.options = ({ grpcLib, host: this.config.rnodeHost, protoSchema })

    this.logger = this.logger.scoped('rnode-connector')
  }

  // TODO: initialize contract to store user data
  @singleStack()
  async initializeRegistryContract() {
  }

  // TODO: for testing
  async generateNewPrivateKey() {
    const secp256k1 = new ec('secp256k1')
    const key = secp256k1.genKeyPair()
    return key
  }

  async deploy(rholangTerm: string) {
    const { getBlocks, doDeploy } = rnodeDeploy(this.options)

    const [lastBlock] = await getBlocks({ depth: 1 })
    this.logger.log('Last block', lastBlock.blockinfo?.blockhash)

    // TODO: hard-coded deployer
    const key = 'bb6f30056d1981b98e729cef72a82920e6242a4395e500bd24bd6c6e6a65c36c'

    const deployData = {
      term: rholangTerm,
      timestamp: Date.now(),
      phloprice: 1,
      phlolimit: 500e3,
      validafterblocknumber: lastBlock.blockinfo?.blocknumber || 0,
    }
    const deploy = signDeploy(key, deployData)
    this.logger.log('Signed deploy', Buffer.from(deploy.sig).toString('hex'))

    const isValidDeploy = verifyDeploy(deploy)
    this.logger.log('Validated deploy', isValidDeploy)

    const { result } = await doDeploy(deploy)
    this.logger.log('Deploy response', result)

    return deploy.sig
  }

  async propose(): Promise<void> {
    this.logger.log('Proposing ...', this.proposeState)

    if (this.proposeState === ProposeState.Idle) {
      this.proposeState = ProposeState.InProgress

      const { propose } = rnodePropose(this.options)

      await propose()
        .then(({ result: proposeRes }) => {
          this.logger.log('Propose done', [this.proposeState, proposeRes])
        })
        .catch((ex: Error) => {
          this.logger.warning('Propose error', ex.message)
        })

      // @ts-ignore - in async code variable can change!
      const continueProposing = this.proposeState === ProposeState.Required
      this.proposeState = ProposeState.Idle

      // Continue with the next propose if required
      if (continueProposing) {
        await this.propose()
      }
    } else if (this.proposeState === ProposeState.InProgress) {
      // Ensure next propose, after current is done
      this.proposeState = ProposeState.Required
    }
  }

  async getDepoloyData(deploySignature: Uint8Array) {
    const { listenForDataAtName } = rnodeDeploy(this.options)

    // Get result from deploy
    const { payload } = await listenForDataAtName({
      depth: 5,
      name: { unforgeablesList: [{ gDeployIdBody: { sig: deploySignature } }] },
    })

    // Raw data (Par objects) returned from Rholang
    const pars = payload!.blockinfoList![0].postblockdataList!

    // Rholang term converted to JSON
    // NOTE: Only part of Rholang types are converted:
    //       primitive types, List, Set, object (Map), Uri, ByteArray, unforgeable names.
    const json = pars.map(rhoParToJson)

    return json
  }
}
