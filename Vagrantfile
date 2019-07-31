# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure("2") do |config|
  # CentOS 7 box
  config.vm.box = "centos/7"

  # Expose Weather API and database ports.
  config.vm.network "forwarded_port", guest: 9999, host: 9999
  config.vm.network "forwarded_port", guest: 5432, host: 9876

  # Bootstrap Puppet
  config.vm.provision "shell", inline: <<-SHELL
    echo "=== Install puppet-agent ==="
    VERS=$(cat /etc/os-release | awk -F= '/^VERSION_ID=/{print $2}' | tr -d '"')
    curl https://yum.puppet.com/puppet5/puppet5-release-el-${VERS}.noarch.rpm > /tmp/puppet5-release-el-${VERS}.noarch.rpm
    rpm -Uvh /tmp/puppet5-release-el-${VERS}.noarch.rpm
    yum install -y puppet-agent
  SHELL

  # Provision environment with Puppet.
  config.vm.provision "puppet" do |puppet|
    puppet.manifests_path = "puppet/manifests"
    puppet.manifest_file = "default.pp"
    puppet.module_path = "puppet/modules"
    puppet.options = "--verbose --debug"
  end
end
