                     README for RabbIT version 4.x

   Introduction: RabbIT is a proxy for HTTP, it is intended to be
   HTTP/1.1 compliant. RabbIT is also a package of tools useful for the
   web.

   RabbIT is intended to speed up surfing over slow links by removing
   unnecessary parts (like background images) while still showing the
   page mostly like it is (don't ruin page-layout etc).

   Since filtering the pages is a "heavy" process RabbIT caches the pages
   it fetches (the filtered pages that is) but tries to respect things
   like pragma no-cache and Cache-Control directives. RabbIT also accepts
   request for nonfiltered pages (by prepending "noproxy" to the adress
   like this: http://noproxy.www.altavista.digital.com/).

   RabbIT is developed and tested under solaris and linux. but since the
   whole package is written in java the basic proxy should run on any
   plattform that supports java.

   RabbIT converts images into low quality jpegs if possible and only
   send the smaller image (use noproxy to view the image unfiltered).
   Image conversion is a heavy process and is done with an external
   program, I would like to do this in java but have not found any good
   and fast package to do it. Anyway as standard it uses convert from
   GraphicsMagick, but it is configurable to use any command line program
   that can do the job. Of course RabbIT can be run with image conversion
   turned off but that is in a way the wrong thing to do since this is
   the big timesaver.

   RabbIT compresses(with gzip) text and HTML pages before they are sent
   to the browser. This results in less data beeing sent and a nice
   speedup.

   RabbIT is able to act as a proxy for SSL connections. Note however
   that RabbIT is unable to filter the encrypted streams.

   RabbIT uses keepalive both to clients and servers whenever possible.

   Whats needed: java 6.x see [1]java.sun.com for the latest java for
   your plattform.

   If you only have access to a java 1.4 engine you can test
   RabbIT/2.0.37b, There have been some changes and bug fixes since then.
   That version is probably good enought for most usage.

   Running: Before you run RabbIT you should configure it, The default
   configuration is probably ok for testing under linux. RabbIT is packed
   in a state that allows you to run the proxy directly after unpacking
   it. After unpacking the file RabbIT4-bin.tar.gz cd into the directory
   named RabbIT4 and start the proxy with a command: 
   java -jar jars/rabbit4.jar -f conf/rabbit.conf

   For some more help try the following: 
   java -jar jars/rabbit4.jar --help

   Configuration: RabbIT is very configurable.Read the file
   conf/rabbit.conf (or conf/rabbit.conf.orig if you have change the
   default configuration) it is commented and is (currently) the best
   source of information for what you can do with RabbIT.

   Users and restricted pages: RabbIT provides an easy and very powerfull
   meta-page system. Therefor it is suggested that you restrict metapages
   to only authorized users. The current security is the simple "Basic"
   authentication from rfc2616. Note that this means that passwords are
   sent in cleartext (well actually uuencoded, but that is cleartext
   since any person can decode it). RabbIT has a userfile(normally the
   file users) that is on the form (one entry per line)
   "userid:password", where password is in cleartext (we dont have access
   to crypt under windows :-/). In the future maybe we can use Digest
   authentication to make it safer. Restriction of metapages is in two
   flavors: you should add a password to them and you should also
   restrict the set of ip:s that can connect (see access.conf for this).
   By default for now RabbIT allows access to everyone (that has
   ip-access rights) to the files found under http:///FileSender/public/,
   this is to allow NoAd.gif and the rabbit logo to be served from the
   proxy instead of from the net which used to be standard (both of these
   images are runtime configurable to either a local proxy file or some
   other URL).

   MetaPages: Definition: a metapage is a service RabbIT provides (in
   this sense it acts as a CGI-webserver). To access metapages you use:
   http://<PROXYHOST>:<PROXYPORT>/Metapage (like for me
   http://magenta11:9666/)

   http://<proxy>/ Takes you to /FileSender/index.html.
   http://<proxy>/Status Current status of the proxy.
   http://<proxy>/Connections Current active (outbound) connections of
   the proxy.
   http://<proxy>/CacheStatus Current status of the proxys cache.
   http://<proxy>/ClearCache Clears the cachedir for the proxy.
   http://<proxy>/Kill Will shut down this proxy instance.
   http://<proxy>/FileSender/filename Makes RabbIT act as a webproxy.
   Uses files in the htdocs directory.

   It is very simple to write a new MetaHandler and RabbIT does not even
   have to be restarted to accept a new MetaPage. Simply make a class
   that implements rabbit.meta.MetaHandler and put it in the CLASSPATH
   for RabbIT. This is an extremly powerful tool, use it with care.

   Cache: RabbIT uses a cache to save filtered pages. This is most useful
   if you are several people running against the same RabbIT proxy since
   most browsers have there own local cache. RabbIT has two values you
   can tweak for optimal size of the cache. The values are

   maxsize: This value is the Maximum size the cache should take, that is
   the cache shouldnt be larger than this at any time (not true now, it
   can be bigger (due to halfcached file(working files), but shouldnt be
   much bigger). This value should be given in MB:s.

   cachetime: This value specifies how many hours RabbIT should keep
   pages it knows nothing about (that has no expires-field in the
   httpheader).

   Documentation and API: RabbIT should be easy to read and understand.
   Since RabbIT is written in java the api for RabbIT is accessible in
   javadoc format. see the directory RabbIT/htdocs/doc/.

   Comments & critisism: Please provide some feedback of what you think
   should be done with RabbIT. That is features you miss, things that can
   be done better etc. A simple letter of the type "RabbIT is a great
   product" is also very welcome. Anyway send it to [2]Robert Olofsson,
   robo@khelekore.org.

References

   1. http://java.sun.com/
   2. mailto:robo@khelekore.org
