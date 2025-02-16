//#FILE: test-http-eof-on-connect.js
//#SHA1: c243d7ad215d84d88b20dfeea40976155f00a2bb
//-----------------
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

"use strict";

const net = require("net");
const http = require("http");

// This is a regression test for https://github.com/joyent/node/issues/44
// It is separate from test-http-malformed-request.js because it is only
// reproducible on the first packet on the first connection to a server.

test("EOF on connect", async () => {
  const server = http.createServer(jest.fn());
  server.listen(0);

  await new Promise(resolve => {
    server.on("listening", () => {
      const client = net.createConnection(server.address().port, "127.0.0.1");

      client.on("connect", () => {
        client.destroy();
      });

      client.on("close", () => {
        server.close(resolve);
      });
    });
  });

  expect(server.listeners("request")[0]).not.toHaveBeenCalled();
});

//<#END_FILE: test-http-eof-on-connect.js
