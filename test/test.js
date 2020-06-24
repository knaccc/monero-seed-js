const Seed = require('../index').Seed;
const BN = require('bn.js');
const assert = require('assert');

let mnemonic = 'possible pond copy window claw sleep humor breeze tomorrow nerve lock produce forward tree';
{
  let seed = Seed.fromMnemonic(mnemonic, Seed.MONERO_COINFLAG);
  assert(seed.getCoinFlag() === 0x539);
  assert(seed.getReserved() === 0);
  assert(seed.getQuantizedBirthday() === 115);
  assert(seed.getPrivateKeySeed().eq(new BN('1f6ca86596f037390ca38375756f73f', 16)));
  assert(seed.getParseResult().mnemonicUsable === true);
  assert(seed.getParseResult().state === 'specifiedSeedIsValid');
  assert(seed.toMnemonic() === mnemonic);
  assert(seed.derivePrivateKeyHex() === 'ec1366947cbbcbfa1c0946598301390ac0440035c9c8bd077afabe38aec7c329');
}
{
  let seed = Seed.fromMnemonic(mnemonic, Seed.MONERO_COINFLAG);
  let seed2 = Seed.fromMnemonic(mnemonic.replace('humor', 'supercalifragilisticexpialidocious'), Seed.MONERO_COINFLAG);
  assert(seed.equals(seed2));
  assert(seed2.getParseResult().detectedErasureWord === 'supercalifragilisticexpialidocious');
  assert(seed2.getParseResult().erasureWordReplacement === 'humor');
  assert(seed2.getParseResult().erasureIndex === 6);
  assert(seed2.getParseResult().state === 'repaired');
  assert(seed2.getParseResult().mnemonicUsable === true);
}
{
  let seed2 = Seed.fromMnemonic(mnemonic.replace('humor', 'hum or'), Seed.MONERO_COINFLAG);
  assert(seed2.getParseResult().mnemonicUsable === false);
  assert(seed2.getParseResult().state === 'tooManyWords');
}
{
  let seed2 = Seed.fromMnemonic(mnemonic.replace('humor', ''), Seed.MONERO_COINFLAG);
  assert(seed2.getParseResult().mnemonicUsable === false);
  assert(seed2.getParseResult().state === 'notEnoughWords');
}
{
  let seed2 = Seed.fromMnemonic(mnemonic.replace('humor', 'xxx').replace('nerve', 'yyy'), Seed.MONERO_COINFLAG);
  assert(seed2.getParseResult().mnemonicUsable === false);
  assert(seed2.getParseResult().state === 'tooManyUnrecognizedWords');
}
{
  let seed2 = Seed.fromMnemonic(mnemonic.replace('humor', 'bounce'), Seed.MONERO_COINFLAG);
  assert(seed2.getParseResult().mnemonicUsable === false);
  assert(seed2.getParseResult().state === 'reedSolomonCheckFailed');
}
{
  let seed2 = Seed.fromMnemonic(mnemonic, Seed.AEON_COINFLAG);
  assert(seed2.getParseResult().mnemonicUsable === false);
  assert(seed2.getParseResult().state === 'reedSolomonCheckFailed');
}
{
  let seed2 = Seed.fromMnemonic('', Seed.MONERO_COINFLAG);
  assert(seed2.getParseResult().mnemonicUsable === false);
  assert(seed2.getParseResult().state === 'notEnoughWords');
}
{
  let seed2 = Seed.randomSeed(3, new Date('2030-01-01' + 'T00:00:00.000Z').getTime() / 1000, Seed.MONERO_COINFLAG);
  assert(seed2.getCoinFlag() === 0x539);
  assert(seed2.getReserved() === 3);
  assert(seed2.getQuantizedBirthday() === 115);
}
{
  let seed2 = Seed.fromMnemonic('test park taste security oxygen decorate essence ridge ship fish vehicle dream fluid pattern', Seed.MONERO_COINFLAG);
  assert(seed2.getParseResult().mnemonicUsable === true);
  assert(seed2.getParseResult().state === 'specifiedSeedIsValid');
  assert(seed2.getReserved() === 0);
  assert(seed2.getQuantizedBirthday() === 957);
  assert(seed2.getCoinFlag() === 0x539);
  assert(seed2.derivePrivateKeyHex() === '7b816d8134e29393b0333eed4b6ed6edf97c156ad139055a706a6fb9599dcf8c');
}
{
  let exceptionThrown = false;
  try {
    let seed2 = Seed.randomSeed(0, new Date('2000-01-01' + 'T00:00:00.000Z').getTime() / 1000, Seed.MONERO_COINFLAG);
  }
  catch (e) {
    if(e.includes('Date cannot be before epoch date')) exceptionThrown = true; // exception due to date being before epoch date for 14-word seeds
  }
  assert(exceptionThrown);
}
{
  let exceptionThrown = false;
  try {
    let seed2 = Seed.randomSeed(3, new Date('2030-01-01' + 'T00:00:00.000Z').getTime() / 1000, Seed.MONERO_COINFLAG);
    let parseResult = seed2.getParseResult();
  }
  catch (e) {
    if(e.includes('This seed was not created by parsing a mnemonic')) exceptionThrown = true; // exception due to the seed not having been created as a result of parsing a mnemonic
  }
  assert(exceptionThrown);
}
