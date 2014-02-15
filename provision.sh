#!/bin/bash
#
# Provisioning script for the Vagrant server.
#
# 1) Install Node.js from binaries using n.
#

# --------------------------------------------------------------------------
# Install build tools.
# --------------------------------------------------------------------------

apt-get update
apt-get install -y build-essential
# Curl is needed by n.
apt-get install -y curl

# --------------------------------------------------------------------------
# Install Node.js from binaries using n.
# See: https://github.com/visionmedia/n
# --------------------------------------------------------------------------

N_VERSION=1.2.1
cd /tmp
# Clean out any leftovers from an earlier provisioning run.
rm -rf n-${N_VERSION}
rm -f ${N_VERSION}.tar.gz

# Obtain n and install it.
wget https://github.com/visionmedia/n/archive/${N_VERSION}.tar.gz
tar zxf ${N_VERSION}.tar.gz
cd n-${N_VERSION}
make install

# Install latest stable version.
n stable
