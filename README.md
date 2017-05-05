# Uptime-checker

- [Intro](#intro)
- [Requirement](#requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Using the dashboard](#using-the-dashboard)
- [Code style rules](#code-style-rules)
- [Testing](#testing)
- [Testing Alert Logic](#testing-alert-logic)
- [Folder structure](#folder-structure)

Intro
-----

This projet is my work for the website poller **cli-based** exercice proposed by **Datadog**

The architecture consideration can be found in [Architecture.md](Architecture.md)

Requirements
-----------

To run this project, you must have a recent version of: 
- **NodeJS (6/7)** 
- **npm** or **yarn**
- **InfluxDB** (a time-series DB for storing the collected metrics)

Further more, the project has been throughly tested on **Mac-os only**, but should work on **Linux**.

There is still a little work left to make the project compatible for **Windows**.

#### Setting up the database

If you want the project to work out of the box with uptime-checker.template.json, you should :

* Install influxdb
* Start influxdb
* Create a database called 'uptime-checker' :

`create database "uptime-checker"`

The double quotes are important !

Installation
-----------

First, clone this github repository.

Install all the dependencies with : 

```
yarn 
``` 

Or  

```
npm install 
``` 

Then you should link the **cli** binary to the npm global folder so you can invoke it using the `uptime-checker` command :

*Note:* For this step to work, npm or yarn global folder should be in your `$PATH`

``` 
yarn link
```

Or

```
npm link
```

If you don't want to bother linking the binaries you can juste invoke the cli binary as an executable :

`./lib/cli/cli.js [commands] ...`


Configuration
-----------

A configuration file template is provied in `uptime-checker.template.json`

The application's configuration file is a **JSON**.

The application will auto-detect the configuration file if :

It is named `uptime-checker.json` or `.uptime-checker.json` and located in one of the following folders according to the following priority : 
 * The uptime-checker project directory
 * The user's home directory 
 * (Only on a Linux-based Operating System) In /etc/uptime-checker/

 You can also pass the configuration file with the cli using the `-c` flag. With accepts relative pathes.

 For smoother testing, you can :

 `cp uptime-checker{.template,}.json` 

 You'll have a configuration file already configured.

 The configuration file is statically checked and validated before the application starts, and it should respect the following rules :

 ```json 
{
     "website": (REQUIRED)
        [  (ARRAY OF OBJECTS)
        {
            "url": "http://google.com", (REQUIRED, MUST START WITH http OR https)
            "checkInterval": "1000", (OPTIONAL, polling check interval default is 2s)
            "httpOptions": {}, (OPTIONAL, http options supported by NODE http.request)
        }
        ],
     "database": {} (OPTIONAL, database connection options as supported by node-influx)
}
 ``` 

If the application finds a lower-priority valid configuration, it will alert the user, then use it instead of the high priority configuration files.

The pollers will send http requests to the url, and will not follow redirections, but log them. This is a choice made while designing the application that is explained in the Architecture document.

By default, the program will connect to the database on `localhost:8086` and query the `uptime-checker` database.

Usage
-------

All the cli commands are available with `uptime-checker --help`

```
Usage: uptime-checker <command>... [--option-1 option-1-value --option-2]

Commands:
  config     All related configuration files utilities
  start      start uptime-checker
  stop       stop uptime-checker
  status     status of uptime-checker
  dashboard  start the dashboard

Options:
  -h, --help                Shows help                     [boolean]
  --configuration-file, -c  Specify a configuration file   [string]
```

The daemon will poll the websites in the backgroud. The daemon must be running for the dashboard to work properly.

If the daemons errors while running, it will create an error file in the project directory

Using the dashboard 
------------------

If the daemon is started (check with `uptime-checker status`), you can start the dashboard with :

`uptime-checker dashboard`

Use left and right arrow keys to navigate between websites.

If there are alerts, use up and down arrow keys to see all the alerts.

Code style rules
---------------

The javascript code is automatically formatted with prettier, and linted with eslint.
With a vim pre-save hook : https://github.com/prettier/prettier-eslint

The commit messages follow Angular community guideline rules

All the code is documented in JSDOC, you can generate the jsdoc and running in the project directory :

``` 
jsdoc lib/* 
``` 

Testing
--------

The `configuration` and `cli` modules are tested using jest (mocks are in `__mocks__` directories, and tests in `__test__`)

As I had time constraints, I couldn't write unit tests for all the modules.

To see the tests running use : 

```
yarn run test:watch
```

Or 

``` 
npm run test:watch
```

Testing Alert Logic 
------------------

The default template configuration file already expects a website on localhost:8080.

You can test manually the alerting logic by starting the daemon with the template config file,
then up the test server with : `node test-server.js`

The server should be on the third page of the dashboard, and you can see availability going up / down, and the recovering logic manually !

Folder structure
----------------

```
├── README.md                     <- The Readme !
├── __mocks__                     <- Some node native modules mocks
│   ├── child_process.js        
│   └── fs.js
├── lib                           <- The source code of the application
│   ├── cli                       <- The command line interface code
│   ├── config                    <- The configuration utilities code
│   ├── daemon                    <- The daemon code
│   ├── dashboard                 <- The UI (dashboard) code
│   ├── database                  <- The database code
│   ├── poller                    <- The polling logic code
│   └── util                      <- Some utilities
├── package.json                  <- Package.json for dependencies
├── uptime-checker.template.json  <- A configuration template
└── yarn.lock                     <- Yarn lockfile
```
