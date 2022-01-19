import { createModuleConfig } from '@deepkit/app'
import { t } from '@deepkit/type'

export const AppConfig = createModuleConfig({
  rabbitHost: t.string.default('amqp://localhost:5672'),
  rnodeHost: t.string.default('localhost:40402'),
})
