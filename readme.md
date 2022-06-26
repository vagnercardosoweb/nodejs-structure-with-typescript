## Technology Uses

- NodeJs [https://nodejs.org/en/](https://nodejs.org/en/)
- Typescript [https://www.typescriptlang.org/](https://www.typescriptlang.org/)
- Express [https://github.com/expressjs/express](https://github.com/expressjs/express)
- ORM Sequelize [https://sequelize.org/](https://sequelize.org/)
- Jest testing [https://jestjs.io/pt-BR/](https://jestjs.io/pt-BR/)
- Docker and Docker-Compose [https://www.docker.com/](https://www.docker.com/)
  - Postgresql [https://www.postgresql.org/](https://www.postgresql.org/)
  - Redis [https://redis.io/](https://redis.io/)
- and other auxiliaries...

## Run Project

It is necessary to have docker and docker-compose installed on your machine, and for that you just access
the [official documentation](https://docs.docker.com/engine/install/) for installation and select your operating system,
after that just run the commands below.

- Clone the repository `git clone git@github.com:vagnercardosoweb/typescript-with-jest.git -b main`
- Access the folder `cd typescript-with-jest`
- Copy `.env.example` to `.env` and change the values according to your needs.
- Run server with docker `npm run dev:docker`
- Run migration with docker `docker exec app.server npm run db:migrate`

after step up your server will be online on host [http://localhost:3333](http://localhost:3333)
