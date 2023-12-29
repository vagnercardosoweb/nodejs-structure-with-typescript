## Technologies Used

- NodeJs [https://nodejs.org/en/](https://nodejs.org/en/)
- Typescript [https://www.typescriptlang.org/](https://www.typescriptlang.org/)
- Express [https://github.com/expressjs/express](https://github.com/expressjs/express)
- Docker and Docker-Compose [https://www.docker.com/](https://www.docker.com/)
  - Postgresql [https://www.postgresql.org/](https://www.postgresql.org/)
  - Redis [https://redis.io/](https://redis.io/)
- and other auxiliaries...

## Run Project

It is necessary to have docker and docker-compose installed on your machine, and for that you just
access
the [official documentation](https://docs.docker.com/engine/install/) for installation and select
your operating system,
after that just run the commands below.

- Clone the
  repository `git clone git@github.com:vagnercardosoweb/nodejs-structure-with-typescript.git -b main`
- Access the folder `cd nodejs-structure-with-typescript`
- Copy `.env.example` to `.env.local` and change the values according to your needs.
- Run server with docker `npm run dev:docker`

The port `3000` is based on `env.DOCKER_PORT`, by default it is `3000`,
if you want to change it, just change the value of the environment variable.

after step up your server will be online on
host [http://localhost:3000](http://localhost:3000)

## Run migrations

Before the steps below, you must generate the `build` with the `npm run build` command if it is not
a `production` build.

If the environment variable `DB_MIGRATION_ON_STARTED` is set to `true` as
migrations will be automatically executed when starting the server, otherwise you can
run manually with the command `NODE_ENV={value} npm run migrator:up`.

The value of `{value}` must be the name of the `env` file configured based on `.env.{value}`,
If the variables are already configured for the environment, just run the
`npm run migrator:up` command.

To rollback migrations, simply run the command `npm run migrator:down:last` to
undo the last operation, or `npm run migrator:down:all` to undo all operations.

## Run tests

- `npm run test:all` to run all tests once
- `npm run test:coverage` to run all tests and generate test coverage report
- `npm run test:watch` to run all tests and watch for changes to files
