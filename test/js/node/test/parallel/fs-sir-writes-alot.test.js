//#FILE: test-fs-sir-writes-alot.js
//#SHA1: d6f4574d48b9a85ee1276e4e0499f3fc32096d24
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

'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');

const tmpdir = path.join(os.tmpdir(), 'test-fs-sir-writes-alot');
const filename = path.join(tmpdir, 'out.txt');

beforeAll(() => {
  if (fs.existsSync(tmpdir)) {
    fs.rmSync(tmpdir, { recursive: true, force: true });
  }
  fs.mkdirSync(tmpdir, { recursive: true });
});

afterAll(() => {
  fs.rmSync(tmpdir, { recursive: true, force: true });
});

test('multiple async writes to a file', async () => {
  const fd = fs.openSync(filename, 'w');

  const line = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaa\n';
  const N = 10240;
  let complete = 0;
  let bytesChecked = 0;

  function testBuffer(b) {
    for (let i = 0; i < b.length; i++) {
      bytesChecked++;
      if (b[i] !== 'a'.charCodeAt(0) && b[i] !== '\n'.charCodeAt(0)) {
        throw new Error(`invalid char ${i},${b[i]}`);
      }
    }
  }

  await new Promise((resolve) => {
    for (let i = 0; i < N; i++) {
      // Create a new buffer for each write. Before the write is actually
      // executed by the thread pool, the buffer will be collected.
      const buffer = Buffer.from(line);
      fs.write(fd, buffer, 0, buffer.length, null, function(er, written) {
        complete++;
        if (complete === N) {
          fs.closeSync(fd);
          const s = fs.createReadStream(filename);
          s.on('data', testBuffer);
          s.on('end', resolve);
        }
      });
    }
  });

  // Probably some of the writes are going to overlap, so we can't assume
  // that we get (N * line.length). Let's just make sure we've checked a
  // few...
  expect(bytesChecked).toBeGreaterThan(1000);
});

//<#END_FILE: test-fs-sir-writes-alot.js
