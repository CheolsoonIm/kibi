module.exports = function () {
  return {
    options: {
      licenses: [
        '(BSD-2-Clause OR MIT OR Apache-2.0)',
        '(BSD-2-Clause OR MIT)',
        '(GPL-2.0 OR MIT)',
        '(MIT AND CC-BY-3.0)',
        '(MIT OR Apache-2.0)',
        'AFLv2.1',
        'Apache 2.0',
        'Apache License, v2.0',
        'Apache',
        'Apache*',
        'Apache, Version 2.0',
        'Apache-2.0',
        'BSD New',
        'BSD',
        'BSD*',
        'BSD-2-Clause',
        'BSD-3-Clause AND MIT',
        'BSD-3-Clause OR MIT',
        'BSD-3-Clause',
        'BSD 3-Clause',
        'BSD-like',
        'CC0-1.0', // kibi: license for spdx-license-ids
        'CC-BY',
        'CC-BY-3.0', // kibi: license for spdx-exceptions
        'CC-BY-4.0',
        'ISC',
        'MIT',
        'MIT*',
        'MIT/X11',
        'new BSD, and MIT',
        'OFL-1.1 AND MIT',
        'Public domain',
        'Unlicense',
        'WTFPL OR ISC',
        'WTFPL',
        '(BSD-3-Clause OR GPL-2.0)' // kibi: license for node-forge
      ],
      overrides: {
        'assert-plus@0.1.5': ['MIT'],
        'buffers@0.1.1': ['MIT/X11'],
        'bytes@1.0.0': ['MIT'],
        'color-name@1.0.0': ['UNLICENSE'],
        'commander@2.2.0': ['MIT'],
        'css-color-names@0.0.1': ['MIT'],
        'css-parse@1.0.4': ['MIT'],
        'css-stringify@1.0.5': ['MIT'],
        'css@1.0.8': ['MIT'],
        'delegate@3.0.1': ['MIT'],
        'flatten@0.0.1': ['MIT'],
        'indexof@0.0.1': ['MIT'],
        'jsonify@0.0.0': ['Public domain'],
        'ripemd160@0.2.0': ['MIT'],
        'select@1.0.6': ['MIT'],
        'uglify-js@2.2.5': ['BSD'],
        // kibi: add our licenses
        'JSONSelect@0.4.0': ['MIT'],
        'cycle@1.0.3': ['Public domain'],
        'jison-lex@0.2.1': ['MIT'],
        'jison@0.4.13': ['MIT'],
        'nomnom@1.5.2': ['MIT'],
        'jsonify@0.0.0': ['MIT'],
        'js-base64@2.3.1': ['BSD-3-Clause']
        // kibi: end
      }
    }
  };
};
