# QuickWeather API
## Application prerequisites
### 

## Development
### Theory of operation
The local development environment leverages Vagrant and the VirtualBox provider to provision a development and test environment for the QuickWeather API, including a self-contained PostgreSQL database installed via the [puppetlabs-postgresql](https://forge.puppet.com/puppetlabs/postgresql). The API's process is managed by [Supervisor](http://supervisord.org/).
### Local development environment:
#### Prerequisites
* Vagrant (tested on version 2.2.5)
* VirtualBox (tested on version 5.2.18)
* The [vagrant-vbguest](https://github.com/dotless-de/vagrant-vbguest) plugin (via `vagrant plugin install vagrant-vbguest`)
  * This is required because the official CentOS7 package doesn't install the VirtualBox addons by default and will prevent moutning local filesystems.
#### Using the development environment
* To start the development environment change directories into the root of this repository and execute `vagrant up`.
* To restart the node.js process for the QuickWeather API execute `sudo supervisorctl restart quickweather` after accessing the running vagrant box using `vagrant ssh`.
* To terminate the development environment change directories into the root of this repository and execute `vagrant destroy`.
#### Exposed ports
* TCP `9999` serves the QuickWeather API via HTTP.
* TCP `9876` exposes the PostreSQL database to the local host.
