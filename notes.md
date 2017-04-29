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
- getting a response can be as high as 6s
- connect ETIMEDOUT errors
- read ETIMEDOUT errors
- a lot of 301/302 redirects to https servers
- some adresses not DNS resolved (getaddrinfo ENOTFOUND, which is
surprising for the top 1000 websites)
