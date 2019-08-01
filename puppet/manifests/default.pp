# Bring our Vagrant user into Puppet.
user { "vagrant":
  ensure                  => "present",
}

# Install necessary packages.
package { 'epel-release':
  ensure                  => "installed",
}

package { 'python-pip':
  ensure                  => "installed",
}

package { 'postgresql':
  ensure                  => "installed",
}

package { 'postgresql-devel':
  ensure                  => "installed",
}

package { "supervisor":
       ensure             => "installed",
       provider           => 'pip',
       require            => Package['python-pip'],
}

package { 'curl':
  ensure                  => "installed",
}

# Set up nvm for the vagrant user
exec { 'nvm-install':
	command => '/usr/bin/curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash',
	creates => '/home/vagrant/.nvm',
	user => 'vagrant',
	environment => 'HOME=/home/vagrant',
	require => [ Package['curl'], User['vagrant'] ],
}

exec { 'node-install':
	command => '/bin/bash -c "source /home/vagrant/.bashrc && nvm install 10.16.0 && nvm alias default 10.16.0"',
	user => 'vagrant',
	environment => 'HOME=/home/vagrant',
	require => Exec['nvm-install']
}

# Bootstrap PostgreSQL
class { 'postgresql::globals':
  encoding                => 'UTF-8',
  locale                  => 'en_US.UTF-8',
}

class { 'postgresql::server':
  locale                  => 'en_US.UTF-8',
  ip_mask_allow_all_users => '0.0.0.0/0',
  listen_addresses        => '*',
  ipv4acls                => ['local all all md5'],
  postgres_password       => 'postgres',
  require                 => User['vagrant']
}

postgresql::server::role { 'vagrant':
  createdb                => true,
  login                   => true,
  password_hash           => postgresql_password("vagrant", "vagrant"),
  require                 => Class['Postgresql::Server'],
}

postgresql::server::db { 'quickweather':
  user                    => 'vagrant',
  password                => postgresql_password('vagrant', 'vagrant'),
  require                 => Class['Postgresql::Server'],
}
