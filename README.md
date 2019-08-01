# QuickWeather API

## General application notes

### Application prerequisites
* Node.js 10.16.0 (LTS/Dubnium)
* NVM
* Supervisor
* API key from [OpenWeathermap](https://openweathermap.org/api) with current data subscription (free).

### Background
QuickWeather is a caching RESTful API that supports retrieving the temperature for a given city and state in the US. It's designed to run as an unprivileged user on a node bheind a load balancer that wraps connections in SSL when in production. The only supported routes in the API are */\<state\>/\<city\>/temperature* where state and city are the city name and two letter state abbreviation (OR, CO, WY, etc.).
The application is designed to be distributed using Jenkins or AWS CodeDeploy jobs. Secrets such as the API key and Postgres database settings in `config.yml` should be distributed using encrypted Hieradata parameters. When distributing the package via Jenkins use SSH upload jobs to distribute the package, but make sure Puppet manages `config.yml`. AWS CodeDeploy can also be used to deploy the application to EC2 instances, and Puppet should manage `config.yml`.

### Repository layout
* `config/` stores sequelize CLI configurations.
  * `config.json` stores configuration values for the Sequelize CLI utilities.
* `db/` contains Sequelize migrations and seeders.
* `dist/` contains a sample application configuration.
* `puppet/` contains Puppet modules, etc. required for Vagrant to provision development environments.
* `src/` contains the principal server code.
  * `server.js` - is the main executable that serves the API.
  * `modles/` - contains sequelize models for the PostgreSQL database.
* `package.json` - NPM package file.
* `package-lock.json` - NPM package lock file.
* `README.md` - this file.
* `Vagrantfile` - File used to provision the local Vagrant environment.

### Thory of operation.
After being deployed QuickWeather API should be executed and kept online using Superviosr inside an NMV enrionment to ensure that the execution environment for QuickWeather is kept separate from the system Node.JS verson of the node running the project. NVM should be installed in the user running the application's profile. When started the application reads `config.yml` in the root of the project and uses the information contained there to create database connections, connect to APIs, determine listning ports, etc.
When an HTTP request arrives the application uses the incoming request route to determine which city and state the data is being requested for. After that it uses the city and state to request geocoding information which is then passed to the source Open Weather API to request current weather observations. That data is then passed to the user aalong with a timestamp for when the request came in. Responses are sent as JSON-formatted strings like `{"timestamp":"2019-08-01T08:37:35.806Z","temperature":11.55}` when a request is issued against a local dev environment using `curl http://127.0.0.1:9999/OR/portland/temperature`.
Entries are then cached in PosgreSQL with an expiration value. If the entry doesn't already exist in the database or has expired already the call to Open Weather API is made and the temperature data along with the city and state are cached.

### Deployment
Production deployments should be done via CI/CD. The distribution pakcage should be created by running `npm ci`. If migrations are to be run from CI/CD secrets and configuration values for procution should be written to `config/config.json` and then `npm run migrate:up` should be issue to make sure the procution Posgtres database's schema is up-to-date. The packages should then be distibuted via appropirate Jeninks or CodeDeploy jobs. If any configuration changes are necessary they should be made using Puppet. If the Puppet agent has to be run quickly Ansible or Puppet Bolt can be used to trigger Puppet agent on the appropriate systems.

To manually create a distribution run the following commands inside an appropriate nvm envioronment using Node.JS 10.16.0:
```
npm ci
cp dist/config.yml .
cp config/config.json.dist config/config.json
```

You should then edit both `config.yml` and `config/config.json` to have appropriate values for the environment being deployed to. Example configuration values for a local environment:

config.yml:
```yaml
---
openWeatherApi:
  appid: "deadbeefdeadbeefdeadbeefdeadbeef"
openStreetMap:
  base_url: "https://nominatim.openstreetmap.org"
service:
  listen_port: 9999
  user_agent: "QuickWeather/1.0"
cache:
  geocode_max_age: 604800
  temperature_max_age: 1899
db:
  user: "vagrant"
  password: "vagrant"
  host: "127.0.0.1"
  port: 5432
  database: "quickweather"
  cache_table: "temperature_cache"
```

config/config.json
```json
{
  "development": {
    "username": "vagrant",
    "password": "vagrant",
    "database": "quickweather",
    "host": "127.0.0.1",
    "dialect": "postgres"
  },
  "test": {
    "username": "root",
    "password": null,
    "database": "database_test",
    "host": "127.0.0.1",
    "dialect": "postgres"
  },
  "production": {
    "username": "root",
    "password": null,
    "database": "database_production",
    "host": "127.0.0.1",
    "dialect": "postgres"
  }
}
```

## Development and testing environment
### Theory of operation
The local development environment leverages Vagrant and the VirtualBox provider to provision a development and test environment for the QuickWeather API, including a self-contained PostgreSQL database installed via the [puppetlabs-postgresql](https://forge.puppet.com/puppetlabs/postgresql). The API's process is managed by [Supervisor](http://supervisord.org/). The database is created by Puppet, and Sequelize mgrations create the ncessary tables.
### Local development environment:

#### Prerequisites
* Vagrant (tested on version 2.2.5)
* VirtualBox (tested on version 5.2.18)
* The [vagrant-vbguest](https://github.com/dotless-de/vagrant-vbguest) plugin (via `vagrant plugin install vagrant-vbguest`)
  * This is required because the official CentOS7 package doesn't install the VirtualBox addons by default and will prevent moutning local filesystems.

#### Using the development environment
* To start the development environment change directories into the root of this repository and execute `vagrant up`. The Puppet manifest will install all necessary packaes, copy any distributed configuration files, and will also create the Postgres tables.
* Make sure you edit config.yml and add your individual OpenWeather API key to the `appid` key in the `OpenWeatherApi` section of config.yml.
* You can now start the QuickWeather service by running the following: `cd /vagrant && npm start`. Please note that this does not start automatically with the Vagrant box, and doesn't automatically reload when code changes are made. Just use Control + C to kill the node process and start it again using `npm start`.
* The Weather API should be exposed at http://127.0.0.1:9999/ after the setup is complete.
* To terminate the development environment change directories into the root of this repository and execute `vagrant destroy`.

#### Exposed ports
* TCP `9999` serves the QuickWeather API via HTTP.
* TCP `9876` exposes the PostreSQL database to the local host.
