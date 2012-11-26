
About
=====

...


How to build
============

**It should be built** from the ``mosaic-distribution`` repository, as it depends on a proper set workbench and symlinks to other
repositories...

* dependencies:

 * ``java`` version ``1.7``;
 * ``nodejs`` version ``0.8.x``;
 * ``npm`` latest version;
 * correct setup of symlinks towards other source code repositories;

* (for the backend) inside a console, into the root folder of the project: ::

  ./backend/scripts/prepare
  ./backend/scripts/compile

* (for the frontend) inside a console, into the root folder of the project: ::

  ./frontend/scripts/prepare
  ./frontend/scripts/compile

How to run
==========

* (for the backend) inside a console, into the root folder of the project, one of the following commands for each role: ::

  ./backend/scripts/run-fetcher
  ./backend/scripts/run-indexer

* (for the backend) inside a console, into the root folder of the project: ::

  ./frontend/scripts/run-component

* (for the various backend tools) inside a console, into the root folder of the project, one of the following commands for each role: ::

  ./backend/scripts/run-scavanger
  ./backend/scripts/run-pusher
  ./backend/scripts/run-leacher


How to use
==========

* for each of the components below, start an istance:

 * ``mosaic-components-rabbitmq``;
 * ``mosaic-components-riak-kv``;
 * ``mosaic-components-httpg``;

* (for each of the commands below) inside a console, into the root folder of the project: ::

  ./backend/scripts/run-fetcher
  ./backend/scripts/run-indexer
  ./frontend/scripts/run-component

* point your browser to http://127.0.0.1:20760/ and your request should reach the backend service;


Notice
======

This product includes software developed at "Institute e-Austria, Timisoara",
as part of the "mOSAIC -- Open-Source API and Platform for Multiple Clouds"
research project (an EC FP7-ICT Grant, agreement 256910).

* http://developers.mosaic-cloud.eu/
* http://www.ieat.ro/

Developers:

* Ciprian Dorin Craciun, ciprian@volution.ro / ciprian.craciun@gmail.com
* Alin Paulesc, paulesc.alin@info.uvt.ro

Copyright: ::

   Copyright 2010-2011, Institute e-Austria, Timisoara, Romania
       http://www.ieat.ro/
   
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at:
       http://www.apache.org/licenses/LICENSE-2.0
   
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.

