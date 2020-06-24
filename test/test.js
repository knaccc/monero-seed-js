const Seed = require('../index').Seed;
const BN = require('bn.js');
const assert = require('assert');

let mnemonic = 'possible pond copy window claw sleep humor breeze tomorrow nerve lock produce forward tree';
{
  let seed = Seed.fromMnemonic(mnemonic, Seed.MONERO_COINFLAG);
  assert(seed.coinFlag === 0x539);
  assert(seed.reserved == 0);
  assert(seed.birthday == 115);
  assert(seed.privateKeySeed.eq(new BN('1f6ca86596f037390ca38375756f73f', 16)));
  assert(seed.parseMnemonicResult.mnemonicUsable === true);
  assert(seed.parseMnemonicResult.state === 'specifiedSeedIsValid');
  assert(seed.toMnemonic() === mnemonic);
}
{
  let seed = Seed.fromMnemonic(mnemonic, Seed.MONERO_COINFLAG);
  let seed2 = Seed.fromMnemonic(mnemonic.replace('humor', 'supercalifragilisticexpialidocious'), Seed.MONERO_COINFLAG);
  assert(seed.equals(seed2));
  assert(seed2.parseMnemonicResult.detectedErasureWord === 'supercalifragilisticexpialidocious');
  assert(seed2.parseMnemonicResult.erasureWordReplacement === 'humor');
  assert(seed2.parseMnemonicResult.erasureIndex === 6);
  assert(seed2.parseMnemonicResult.state === 'repaired');
  assert(seed2.parseMnemonicResult.mnemonicUsable === true);
}
{
  let seed2 = Seed.fromMnemonic(mnemonic.replace('humor', 'hum or'), Seed.MONERO_COINFLAG);
  assert(seed2.parseMnemonicResult.mnemonicUsable === false);
  assert(seed2.parseMnemonicResult.state === 'tooManyWords');
}
{
  let seed2 = Seed.fromMnemonic(mnemonic.replace('humor', ''), Seed.MONERO_COINFLAG);
  assert(seed2.parseMnemonicResult.mnemonicUsable === false);
  assert(seed2.parseMnemonicResult.state === 'notEnoughWords');
}
{
  let seed2 = Seed.fromMnemonic(mnemonic.replace('humor', 'xxx').replace('nerve', 'yyy'), Seed.MONERO_COINFLAG);
  assert(seed2.parseMnemonicResult.mnemonicUsable === false);
  assert(seed2.parseMnemonicResult.state === 'tooManyUnrecognizedWords');
}
{
  let seed2 = Seed.fromMnemonic(mnemonic.replace('humor', 'bounce'), Seed.MONERO_COINFLAG);
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

