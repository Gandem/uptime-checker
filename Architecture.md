# Defining the architecture

- [Concerns](#concerns)
- [General Architecture](#general-architecture)
- [Designing an HTTP Poller](#designing-an-http-poller)
- [Daemonizing a process with Javascript](#daemonizing-a-process-with-javascript)
- [The database](#the-database)
- [General Javascript code concerns](#general-javascript-code-concerns)

## Concerns

The separate concerns of the problem are :
- **The Poller and availability checker** : does the http / https / dns request for a determined site and writes to the database. Also checks the availability. It should keep running on the server even if the user quits his shell.
- **The Database** : contains information on all the responses
- **The Console Renderer** : display the statistics and alerts

## General Architecture


                                          ___
                  +----------------+      |1|     +----------------+
                  |                |<-----------> |      CLI       |
                  |     Daemon     |              | start/stop the |
                  |                |              |     daemon     |
                  |                |              +----------------+
                  |                |
                  |                |     ___
                  |   Polls the    |     |3|      +----------------+
                  | websites using |<-----------> |   Dashboard    |
                  |  HTTP/DNS/ICMP |              |   show data    |
                  |                |              |                |       
                  |   Calculate    |              +----------------+
                  | availability & |                  ^  ___
                  |     alerts     |                  |  |4|
                  +----------------+                  |  ---   
                          ^                           v
                      ___ |            +----------------+
                      |2| |            |                |
                      --- +----------->|    Database    |
                                       |                |
                                       +----------------+

**1/** The CLI starts the daemon, giving it the config file if the flag is given <br/>
**2/** The daemon starts, reads the configuration, listen on an IPC socket so the CLI/Dashboard can
ping it back / stop it / get its status <br />
 The daemon starts polling websites and logs the results to the database. <br/>
 The daemon periodically calulates availability and logs the result to the database, and the appropriate alerts.<br/>
**3/** The dashboard, on starting, asks the daemon which sites the daemon is polling<br/>
**4/** The dashboard queries the database for those websites and aggregates min/max/avg and response code data.
It also queries for availability and alerts.


In the ideal case scenario, the aggregation would be done by another daemon. However, I didn't have time to implement it. The daemon class is independant and could be reused for such a case.

## Designing an HTTP poller 

First of all, I had to decide on the choice of technologies for the poller : I am used to NodeJS, which at first glance seems a good choice, but how many websites could a poller written in Node handle ?

After a small test, I was able to poll over 1000 websites which seemed good enough for the exercise.

#### Websites to test and debug the poller

I found the Alexa ranking to get the first 1000 most visited sites :
https://github.com/davedash/Alexa-Top-Sites :
http://s3.amazonaws.com/alexa-static/top-1m.csv.zip

I figured they would be good default options to test the poller.

Top sites polling tests may be biased as the sites are theoretically optimized to handle requests with smaller TFFB.

I decided to do the tests on two ranges :
- 0-1000 top sites

Theoretically, the latter have a bigger TTFB, we could pick websites further down in the list; however
we would have bigger chances of receiving unusual HTTP responses,
which will give us a biased result, if we are looking to test sheer performance. We keep the rest of the list to test the robustness
of our poller afterwards (which we didn't have time to do)

#### Javascript code

The Javascript code and the csv can be found in the `./poller-design` folder !

#### Http polling

- Getting a response can last up to 6s (depends on latency)
- There are **connect ETIMEDOUT** errors, **read ETIMEDOUT**, **sockethangup** :
     the poller must be resilient to such errors, when no http response is sent.
- A lot of the responses are **301/302** redirects to https servers.
- Some addresses not DNS resolved (we obtain a **getaddrinfo ENOTFOUND error**, which is surprising for the top 1000 websites)

The majority of **ENOTFOUND** errors are due to :
- subdomains being used (for youtube image domain)
- DNS "misconfigured" : website is on www.domain.tld and not on
domain.tld with a CNAME.

#### Handling 301/302

A user may want to test the redirect as a full website, making sure the user is always redirected and fast.

I made the choice, for the exercice, to *not* follow 301/302 redirects. If the url leads to a redirect, we log the redirect, without actually making another http request.

This could clearly be improved in further iteration of the exercise.

#### Some default HTTP headers 

While diagnosing **ETIMEDOUT errors** I noticed some web servers react in an awkward manner if not given some HTTP options:

For example, while testing the connection to playstation.com using telnet :

```
telnet playstation.com 80
```

```
GET / HTTP/1.1
Host: playstation.com
```

The request times out !

After testing with various headers, the request only works when we have a user-agent header included (which explains an inconsistency encountered between NodeJS http.get and postman
(the latter includes a user-agent header by default).

Which leads to the following http headers:

```js
headers: {
  'User-Agent': 'WebsitePoller/1.0',
  Accept: '*/*',
  'Cache-control': 'no-cache',
}
```
## Daemonizing a process with javascript

#### Running a child process from node

We want to let our poller run in its own process so it keeps polling in the background, and calculating the appropriate variables. I first started looking at **pm2** code to see how 
**pm2** daemonizes normal node processes.

As shown in the following source code: 

https://github.com/Unitech/pm2/blob/master/lib/Daemon.js#L47

**pm2** uses node **child_process** to fork another process which will be the daemon.

#### Communicating with the process

We also want to be able to send queries to the daemon, asking it for it's status / to stop / etc... Furthermore, a client sould be able to "ping" the poller to see if it's up (the client would be the cli / the dashboard)

The client is not necessarily the parent of the process, so default methods used be **child_process** (fd communication on stdin / stdout) won't work in our use case.

While checking how other libs do it, **pm2** has it's own Inter-Process Communcation (**IPC**) implemented (RPC with an axon MQ) but seems a bit outdated, and overkill for our use case (and not well documented).

The best solution we found was node-ipc, which is well maintained and documented, and also works out of the box on \*nixes and windows.

Thus, the daemon would be a node-ipc server, listening on a linux socket. The client would be simple node-ipc clients.

## The database

We want some data to be persistent in order to calculate the availability for alerts, and the alerts themselves.

**InfluxDB** seemed a nice choice as it is a time-series database (nice for storing metrics) 

`node-influx` package is a well maintained npm package, plus it nicely parses query results into json !

## The CLI

The CLI is designed with `yargs` which is a straight forward npm package to design cli.

## The Dashboard

The dashboard is designed with `blessed` and `blessed-contrib`

## General Javascript code concerns

I tend to like the following patterns when coding with javascript.

- Avoid V8 de-opt, because switching between compiled and interpreted can be costly at scale
  * === false / true so that the compiler knows the variable is a boolean and the code is JIT Compiled
  * === null / undefined for the same reason 

- Handling errors:
  * In asynchronous code, error handling is generally done either by passing the first argument to a callback or by rejecting inside a promise
  * In synchronous code, the best practice is checking if the returned object is an instanceof **Error** 

    The configuration code is for example fully synchronous so it follows the `instanceof` convention.

- To avoid callback hell, we'll mainly use Promises. As bluebird promises are faster than native promises and provide a nice API with .promisify() we'll use them !

- Testing : Only the configuration module is tested thouroughly with Unit tests. This is due to the fact that I needed to rush to finish the exercise 
I used jest because it is a zero-conf testing framework that is blazingly fast !
