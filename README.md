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

## Stop

Stop RNode and RabbitMQ instances.

```sh
docker-compose down
```
