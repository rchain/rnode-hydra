import 'reflect-metadata'
import { App } from '@deepkit/app'
import { Logger, LoggerLevel } from '@deepkit/logger'
import { FrameworkModule } from '@deepkit/framework'
import { ApiConsoleModule } from '@deepkit/api-console-module'
import { eventDispatcher } from '@deepkit/event'
import { httpWorkflow, JSONResponse } from '@deepkit/http'

import { AppConfig } from './config/app-config'
import { RNodeConnector } from './rchain/RNodeConnector'
import { RabbitMqConnector } from './rabbitmq/RabbitMqConnector'
import { HydraController } from './api/HydraController'
import { RNodeController } from './api/RNodeController'
import { RabbitMqController } from './api/RabbitController'
import { HydrationService } from './hydra/HydrationService'

const apiModule = new ApiConsoleModule({
  path: '/admin/api',
  markdown: `
    # RChain hydration module

    Welcome to RNode hydration API inspector.
  `,
})

class ControllerErrorListener {
  @eventDispatcher.listen(httpWorkflow.onControllerError, 200)
  onError(event: typeof httpWorkflow.onControllerError.event) {
    const err = {
      message: event.error.message,
    }
    event.send(new JSONResponse(err, 400))
  }
}

new App({
  config: AppConfig,
  controllers: [
    HydraController, RNodeController, RabbitMqController,
  ],
  imports: [
    new FrameworkModule({
      // debug: true,
    }),
    apiModule,
  ],
  providers: [HydrationService, RNodeConnector, RabbitMqConnector],
  listeners: [ControllerErrorListener],
})
  .setup((module, config) => {
    module.setupGlobalProvider(Logger).level = LoggerLevel.debug
  })
  .loadConfigFromEnv()
  .run()
