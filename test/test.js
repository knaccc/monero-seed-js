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

{
  let seed2 = Seed.fromMnemonic(mnemonic.replace('stadium', 'supercalifragilisticexpialidocious'), Seed.MONERO_COINFLAG);
  assert(seed.equals(seed2));
  assert(seed2.parseMnemonicResult.detectedErasureWord === 'supercalifragilisticexpialidocious');
  assert(seed2.parseMnemonicResult.erasureWordReplacement === 'stadium');
  assert(seed2.parseMnemonicResult.erasureIndex === 2);
  assert(seed2.parseMnemonicResult.state === 'repaired');
  assert(seed2.parseMnemonicResult.mnemonicUsable === true);
}
{
  let seed2 = Seed.fromMnemonic(mnemonic.replace('stadium', 'sta dium'), Seed.MONERO_COINFLAG);
  assert(seed2.parseMnemonicResult.mnemonicUsable === false);
  assert(seed2.parseMnemonicResult.state === 'tooManyWords');
}
{
  let seed2 = Seed.fromMnemonic(mnemonic.replace('stadium', ''), Seed.MONERO_COINFLAG);
  assert(seed2.parseMnemonicResult.mnemonicUsable === false);
  assert(seed2.parseMnemonicResult.state === 'notEnoughWords');
}
{
  let seed2 = Seed.fromMnemonic(mnemonic.replace('stadium', 'xxx').replace('juice', 'yyy'), Seed.MONERO_COINFLAG);
  assert(seed2.parseMnemonicResult.mnemonicUsable === false);
  assert(seed2.parseMnemonicResult.state === 'tooManyUnrecognizedWords');
}
{
  let seed2 = Seed.fromMnemonic(mnemonic.replace('stadium', 'bounce'), Seed.MONERO_COINFLAG);
  assert(seed2.parseMnemonicResult.mnemonicUsable === false);
  assert(seed2.parseMnemonicResult.state === 'reedSolomonCheckFailed');
}
{
  let seed2 = Seed.fromMnemonic(mnemonic, Seed.AEON_COINFLAG);
  assert(seed2.parseMnemonicResult.mnemonicUsable === false);
  assert(seed2.parseMnemonicResult.state === 'reedSolomonCheckFailed');
}
{
  let seed2 = Seed.fromMnemonic('', Seed.MONERO_COINFLAG);
  assert(seed2.parseMnemonicResult.mnemonicUsable === false);
  assert(seed2.parseMnemonicResult.state === 'notEnoughWords');
}
{
  let seed2 = Seed.randomSeed(3, new Date('2030-01-01' + 'T00:00:00.000Z').getTime() / 1000, Seed.MONERO_COINFLAG);
  assert(seed2.coinFlag === 0x539);
  assert(seed2.reserved == 3);
  assert(seed2.birthday == 115);
}
{
  let seed2 = Seed.fromMnemonic('test park taste security oxygen decorate essence ridge ship fish vehicle dream fluid pattern', Seed.MONERO_COINFLAG);
  console.log(seed2.toString());
  assert(seed2.parseMnemonicResult.mnemonicUsable === true);
  assert(seed2.parseMnemonicResult.state === 'specifiedSeedIsValid');
  assert(seed2.derivePrivateKeyHex() === '7b816d8134e29393b0333eed4b6ed6edf97c156ad139055a706a6fb9599dcf8c');
}

