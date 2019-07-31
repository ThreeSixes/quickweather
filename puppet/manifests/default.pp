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
  require                 => Package['epel-release'],
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
