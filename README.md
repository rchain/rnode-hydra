# RNode Hydra

Data hydration example for RNode with RabbitMQ.

## Install

Install nodejs dependencies.

```sh
npm install
```

## Run

Start RNode and RabbitMQ instances with Docker compose.

```sh
docker compose up -d
```

Start nodejs web application.

```sh
npm start
```

The console output should show a successful start.

The Debug Console API page is then available at http://localhost:8080/admin/api.

```
2022-01-19T19:36:15.758Z [LOG] Start server ...
2022-01-19T19:36:15.763Z [LOG] RPC Controller NamedApiConsoleController .deepkit/api-console/admin/api/
2022-01-19T19:36:15.763Z [LOG] 10 HTTP routes
2022-01-19T19:36:15.763Z [LOG] HTTP Controller HydraController
2022-01-19T19:36:15.763Z [LOG]   POST /api/init
2022-01-19T19:36:15.764Z [LOG]   POST /api/send
2022-01-19T19:36:15.764Z [LOG] HTTP Controller RNodeController
2022-01-19T19:36:15.764Z [LOG]   POST /api/rnode-send
2022-01-19T19:36:15.764Z [LOG]   POST /api/rnode-send-propose-result
2022-01-19T19:36:15.764Z [LOG] HTTP Controller RabbitMqController
2022-01-19T19:36:15.764Z [LOG]   POST /api/rabbit-connect
2022-01-19T19:36:15.764Z [LOG]   POST /api/rabbit-init-publisher
2022-01-19T19:36:15.764Z [LOG]   POST /api/rabbit-init-consumer
2022-01-19T19:36:15.764Z [LOG]   POST /api/rabbit-send
2022-01-19T19:36:15.764Z [LOG] HTTP Controller ApiConsoleController
2022-01-19T19:36:15.764Z [LOG]   GET /admin/api/
2022-01-19T19:36:15.764Z [LOG]   GET /admin/api
2022-01-19T19:36:15.764Z [LOG] HTTP listening at http://0.0.0.0:8080
2022-01-19T19:36:15.764Z [LOG] Server started.
```

## Stop

Stop RNode and RabbitMQ instances.

```sh
docker-compose down
```
