const Seed = require('../index').Seed;
const BN = require('bn.js');
const assert = require('assert');

const mnemonic = 'able settle stadium bracket hill rate juice bar among another junior bounce lake process';
let seed = Seed.fromMnemonic(mnemonic, Seed.MONERO_COINFLAG);
assert(seed.coinFlag===0x539);
assert(seed.birthday.eq(new BN(38)));
assert(seed.privateKeySeed.eq(new BN('b9a7c6b35db22f184983f098f2469be5', 16)));
assert(seed.parseMnemonicResult.mnemonicUsable===true);
assert(seed.parseMnemonicResult.state==='specifiedSeedIsValid');
assert(seed.toMnemonic()===mnemonic);

let seed2 = Seed.fromMnemonic(mnemonic.replace('stadium', 'supercalifragilisticexpialidocious'), Seed.MONERO_COINFLAG);
assert(seed.equals(seed2));
assert(seed2.parseMnemonicResult.detectedErasureWord==='supercalifragilisticexpialidocious');
assert(seed2.parseMnemonicResult.erasureWordReplacement==='stadium');
assert(seed2.parseMnemonicResult.erasureIndex===2);
assert(seed2.parseMnemonicResult.state==='repaired');
assert(seed2.parseMnemonicResult.mnemonicUsable===true);

let seed3 = Seed.fromMnemonic(mnemonic.replace('stadium', 'sta dium'), Seed.MONERO_COINFLAG);
assert(seed3.parseMnemonicResult.mnemonicUsable===false);
assert(seed3.parseMnemonicResult.state==='tooManyWords');

let seed4 = Seed.fromMnemonic(mnemonic.replace('stadium', ''), Seed.MONERO_COINFLAG);
assert(seed4.parseMnemonicResult.mnemonicUsable===false);
assert(seed4.parseMnemonicResult.state==='notEnoughWords');

let seed5 = Seed.fromMnemonic(mnemonic.replace('stadium', 'xxx').replace('juice', 'yyy'), Seed.MONERO_COINFLAG);
assert(seed5.parseMnemonicResult.mnemonicUsable===false);
assert(seed5.parseMnemonicResult.state==='tooManyUnrecognizedWords');

let seed6 = Seed.fromMnemonic(mnemonic.replace('stadium', 'bounce'), Seed.MONERO_COINFLAG);
assert(seed6.parseMnemonicResult.mnemonicUsable===false);
assert(seed6.parseMnemonicResult.state==='reedSolomonCheckFailed');

let seed7 = Seed.fromMnemonic(mnemonic, Seed.AEON_COINFLAG);
assert(seed7.parseMnemonicResult.mnemonicUsable===false);
assert(seed7.parseMnemonicResult.state==='reedSolomonCheckFailed');

let seed8 = Seed.fromMnemonic('', Seed.MONERO_COINFLAG);
assert(seed8.parseMnemonicResult.mnemonicUsable === false);
assert(seed8.parseMnemonicResult.state === 'notEnoughWords');

// test with tevador's example currently failing
let seed9 = Seed.fromMnemonic('test park taste security oxygen decorate essence ridge ship fish vehicle dream fluid pattern', Seed.MONERO_COINFLAG);
assert(seed9.parseMnemonicResult.mnemonicUsable===true);
assert(seed9.parseMnemonicResult.state==='specifiedSeedIsValid');
assert(seed9.derivePrivateKeyHex()==='7b816d8134e29393b0333eed4b6ed6edf97c156ad139055a706a6fb9599dcf8c');


