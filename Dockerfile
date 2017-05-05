FROM influxdb

RUN curl -sL https://deb.nodesource.com/setup_7.x | bash - && apt-get install -y nodejs

COPY lib /home/uptime-checker/lib
COPY package.json /home/uptime-checker/
COPY uptime-checker.template.json /home/uptime-checker/uptime-checker.json

RUN cd /home/uptime-checker/ && npm install && npm link

CMD start-stop-daemon --start --pidfile /var/run/influxdb/influxd.pid --exec /usr/bin/influxd
