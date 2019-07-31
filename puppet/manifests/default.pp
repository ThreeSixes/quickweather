# Bring our vagrant uset into Puppet.
user { 'vagrant':
  ensure => "present",
}
