Separate concerns :
- poller
- database
- console renderer

First of all, choice of poller technologies :
used to node JS, how many websites could it handle ?
Alexa to get the first 1000 most visited sites
https://github.com/davedash/Alexa-Top-Sites :
http://s3.amazonaws.com/alexa-static/top-1m.csv.zip

Top sites test may be biaised because top 1000 sites are
theoretically optimized to handle request with smaller TFFB

We will do the test on two ranges :
- 0-1000 top sites
- 10000 to 11000 top sites (theoretically have bigger TTFB,
we could pick website further down in the list, however
we would have bigger chances of receiving unusual HTTP responses,
which will give us a biased result, if we are looking to test sheer performance.
We keep the rest of the list to test, afterwards, the robustness
of our poller.)

we use the readline module so our test are compatible only
with NodeJS 0.12 +
arrow function : NodeJS 4.4.5

note: our javascript is automatically formatted with prettier
(with a vim pre-save hook) : https://github.com/prettier/prettier

Remarks on http (80) polling method:
- getting a response can be as high as 6s (depends on latency)
- connect ETIMEDOUT errors
- read ETIMEDOUT errors
- a lot of 301/302 redirects to https servers
- some adresses not DNS resolved (getaddrinfo ENOTFOUND, which is
surprising for the top 1000 websites)
- socket hangup errors

First, we will try to look at ENOTFOUND errors:
some domains like ytimg.com
Is our alexa list up-to-date ? headers in get request
x-amz-meta-alexa-last-modified →20170428140455
last modified 28/04, so or list is up to date
i.ytimg.com is DNS resolved http://www.alexa.com/siteinfo/ytimg.com
as we can see 98.47% of visitors to the domain go to i.ytimg.com

another example in the list would be asahi.com
but where http://www.alexa.com/siteinfo/asahi.com
but here, the majority of visitors go to asahi.com !
so we dig asahi.com -> no A section in the answer
however, we get an A / CNAME answer on www.asahi.com

the majority of ENOTFOUND errors are due to :
- subdomains being used
- DNS "misconfigured" : website is on www.domain.tld and not on
domain.tld with a CNAME.

An idea that popped up in my mind is doing a configuration
validation utility. That configuration utility would send a
test HTTP request to help identifying issues in configuration.
On those cases, it would issue a warning,
saying that the website is not currently accessible, and asking
the user if it's "normal" behaviour.

Then, diagnosing connect ETIMEDOUT errors :
For example : onlinesbi.com which is a banking website.
The DNS resolves correctly to an IP address, however,
the webserver on the IP times out.

It takes around 70s by default for a timeout to be logged.
Maybe implement a custom time out field ?

Next, read ETIMEDOUT errors :
two websites concerned, playstation.com and souq.com
playstation.com has a country selector, but should return 
a 301 status code.

consistently times out with nodeJS, but not with postman
on https, it sends a 301 redirect, which is expected behaviour

the same goes for souq.com

so we test the HTTP connection with telnet :

telnet playstation.com 80

GET / HTTP/1.1
Host: playstation.com

still times out

testing with various headers, the request only works
when we have a user-agent header included (which explains
the inconsistency between NodeJS http.get and postman
(which includes a user-agent header by default)

as it is good practice, when polling we will use a user-agent
that resembles GoogleBot UA string:
Googlebot/2.1 (+http://www.google.com/bot.html)

WebsitePoller/1.0

an error shows on 39.net, the same method
for debugging shows that adding an Accept header resolves 
the issue: `Accept: */*` will be default, unless overriden
by user configuration

only one website always shows socket hang up
and refuse TCP connection from within NodeJS. It behaves 
inconsistently with telnet (timeouts, etc...). Will leave
the debugging of this issue for later


Handling errors:

Semantic check in the caller to see if object instance of Error,
which makes the caller entierly dependent to the implementation 
of this function.

```javascript
/**
 * Load the JSON Configuration file from the file path
 * @param {string} filePath The path of the file to load
 * @return {Object} The configurationObject or an Error object if the JSON could not be parsed
 */
function loadConfigurationFile(filePath) {
    debug(`Loading configuration file from ${filePath}`);

    try {
        return JSON.parse(readFile(filePath));
    } catch (err) {
        debug(`${chalk.red.bold('Error:')} could not read configuration file from ${filePath}`);
        err.message = `Unable to read the ${chalk.bold('configuration file')} in ${filePath} \n Error: ${err.message}`;
        return err;
    }
}
```

NodeJS callbacks, is a good way to deal with the issue => but callback hell  

Promises ! That's why most public API in the code return promises :)
using bluebird promises because they are faster

Configuration files:

Enforcing schema in the given URL :

cannot staticly check if http or https 
if replacing missing with http, could lead to bad UX:

website with 302 redirect (not permanent redirect 301)
to an HTTPS resource would expect the https resource to 
be monitored, however in this case, it is the redirect that 
would be polled by the http.get

Why not follow the redirect ? Requires a lot of logic, and could 
be a point of improvement in the code, however the user may want to monitor 
the redirect. (ex: make sure http clients are actually redirected to https,
make sure the redirection is fast, etc...) 
So the answer is not so obvious, and could be dealt with in future 
iterations of the project. For the scope of the project, enforcing 
schema seems the best trade-off.

