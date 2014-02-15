# Parallel End to End Testing With Selenium Services

This package provides an example Node.js setup for running parallel end to
end Selenium tests using one of these cloud services:

* [SauceLabs](https://saucelabs.com)
* [BrowserStack](http://www.browserstack.com)
* [TestingBot](http://testingbot.com)

These services each provide an SSH tunnel application that allows cloud Selenium
servers to run tests against your local web server, or a web server in your
internal network. Since most of the time taken by a test thread is spent waiting
on responses from the remote server, it is perfectly feasible to run dozens or
even hundreds of parallel end to end tests through a single SSH tunnel on a
single developer machine.

When the Selenium tests for a major project usually require hours to run
serially, the ability to easily run in parallel is very helpful.

## Installation

Install the example package via NPM:

```
npm install selenium-service-example
```

## Setup

You will need to obtain a free account with one of the services noted above.
This won't take long - it is a painless signup. Once registered you can find the
necessary account name, API secret and/or key in your account settings.

Add your newly obtained credentials to the relevant section of
`config/index.js` and set the `service` property in that file to either
`browserlab`, `saucelabs`, or `testingbot`, depending on which service you are
using.

A free account grants you access to very little in the way of resources, but
it will be sufficient to try out this example of how to set up parallel end to
end tests.

## Running the Example Tests

Fire up the Vagrant Ubuntu 12.04 VM; it will provision itself with the latest
stable Node.js version:

```
vagrant up
vagrant ssh
```

Vagrant is used because the SSH tunnel binaries for SauceLabs and BrowserStack
require glibc 2.15 or later as of January 2014. If your host machine is CentOS
or an older version of another distro then the tunnel won't work locally - but
it will in the VM.

Once logged in to the Vagrant VM:

```
cd /vagrant
node runTests
```

Assuming the SSH tunnel successfully instantiated - it will occasionally fail,
which is the way of all cloud services - then two test runner subprocesses will
spawn to run Selenium tests in parallel.

You can look into the log directory to see the output from each test runner
process.



