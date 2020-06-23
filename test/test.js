const Seed = require('../index').Seed;
const BN = require('bn.js');
const assert = require('assert');

let mnemonic = 'grass impact cross scrub arrow chalk pass taste decide crush push lyrics scale slim';
{
  let seed = Seed.fromMnemonic(mnemonic, Seed.MONERO_COINFLAG);
  assert(seed.coinFlag === 0x539);
  assert(seed.birthday == 115);
  assert(seed.privateKeySeed.eq(new BN('418383292fa0bbc4e31a8aeb0af0065e', 16)));
  assert(seed.parseMnemonicResult.mnemonicUsable === true);
  assert(seed.parseMnemonicResult.state === 'specifiedSeedIsValid');
  assert(seed.toMnemonic() === mnemonic);
}
{
  let seed = Seed.fromMnemonic(mnemonic, Seed.MONERO_COINFLAG);
  let seed2 = Seed.fromMnemonic(mnemonic.replace('chalk', 'supercalifragilisticexpialidocious'), Seed.MONERO_COINFLAG);
  assert(seed.equals(seed2));
  assert(seed2.parseMnemonicResult.detectedErasureWord === 'supercalifragilisticexpialidocious');
  assert(seed2.parseMnemonicResult.erasureWordReplacement === 'chalk');
  assert(seed2.parseMnemonicResult.erasureIndex === 5);
  assert(seed2.parseMnemonicResult.state === 'repaired');
  assert(seed2.parseMnemonicResult.mnemonicUsable === true);
}
{
  let seed2 = Seed.fromMnemonic(mnemonic.replace('chalk', 'cha lk'), Seed.MONERO_COINFLAG);
  assert(seed2.parseMnemonicResult.mnemonicUsable === false);
  assert(seed2.parseMnemonicResult.state === 'tooManyWords');
}
{
  let seed2 = Seed.fromMnemonic(mnemonic.replace('chalk', ''), Seed.MONERO_COINFLAG);
  assert(seed2.parseMnemonicResult.mnemonicUsable === false);
  assert(seed2.parseMnemonicResult.state === 'notEnoughWords');
}
{
  let seed2 = Seed.fromMnemonic(mnemonic.replace('chalk', 'xxx').replace('push', 'yyy'), Seed.MONERO_COINFLAG);
  assert(seed2.parseMnemonicResult.mnemonicUsable === false);
  assert(seed2.parseMnemonicResult.state === 'tooManyUnrecognizedWords');
}
{
  let seed2 = Seed.fromMnemonic(mnemonic.replace('chalk', 'bounce'), Seed.MONERO_COINFLAG);
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
  // for compatibility with tevador's code (not currently passing)
  let seed2 = Seed.fromMnemonic('test park taste security oxygen decorate essence ridge ship fish vehicle dream fluid pattern', Seed.MONERO_COINFLAG);
  console.log(seed2.toString());
  assert(seed2.parseMnemonicResult.mnemonicUsable === true);
  assert(seed2.parseMnemonicResult.state === 'specifiedSeedIsValid');
  assert(seed2.derivePrivateKeyHex() === '7b816d8134e29393b0333eed4b6ed6edf97c156ad139055a706a6fb9599dcf8c');
}

