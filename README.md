# Parallel End to End Testing With Selenium Services

This package provides an example Node.js setup for running parallel end to
end Selenium tests using one of these cloud services:

* [SauceLabs](https://saucelabs.com)
* [BrowserStack](http://www.browserstack.com)
* [TestingBot](http://testingbot.com)

These services each provide an SSH tunnel application that allows cloud Selenium
servers to run tests against your local web server, or against a web server in
your internal network. By launching the tunnel you connect an endpoint on your
local machine to the remote Selenium service, allowing it to access the servers
that you can see.

Parallel testing can be highly efficient. Since most of the time taken by a test
thread is spent waiting on responses from the remote server, it is perfectly
feasible to run dozens or even hundreds of parallel end to end test suites
through a single SSH tunnel on a single developer machine.

Given that the Selenium tests for a major project usually require hours to run
serially, the ability to easily run in parallel is very helpful. It can crush
down the time taken to a much more reasonable span.

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

This will:

  * Launch a simple Express server.
  * Launch the SSH tunnel for the configured Selenium service.
  * Launch parallel test processes, each running its own set of end to end tests.
  * Shut down the SSH tunnel.
  * Shut down the Express server.
  * Display the results.

Note that the SSH tunnel for any of these services will sometimes fail to
initialize, or will time out waiting on the remote connection. Cloud services
are only as reliable as the ability to launch and maintain servers, which at
this point is still not all that reliable. Redundancy helps, but not
when you are waiting on one specific connection to one specific server.

Errors of this nature will shut down the process, and will be displayed in the
output. You can also look into the `log` directory to see log files containing
the output from each test runner process, and from the tunnel process itself.

# Specifying the Configuration File

You can specify alternative configuration files when running tests, which should
help with experimentation. Paths must be relative to the project directory.
e.g.:

```
node runTests config/my-configuration-file.js
```

# Potential Improvements

This is a very simple, crude setup. It makes no attempt to be smart about
monitoring the tunnel stdout and stderr pipes for known issues that may cause
the tunnel process to hang rather than end, for example.

Similarly, there are better ways to channel and present the output from test
processes than to just dump them to logs.

# Other Notes

As of Q2 2014, the native binary SSH tunnels for SauceLabs and BrowserStack are
still fairly new. They are not yet as robust as the old Java SSH tunnels that
were used by these services up until Q1 2014, and nor are they as capable of
handling as great a number of test threads.

In BrowserStack's case, you should not try to run more than about 8-10 parallel
test threads through the same tunnel instance as it will definitely run into
issues. If you want greater concurrency then run several tunnel instances in
parallel and split your threads between them.
