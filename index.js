const reedSolomon = require('reedsolomon');
const crypto = require('crypto');
const BN = require('bn.js');
const electrumWords = require('./electrum-words').electrumWords;

const epoch = 1590969600; //1st June 2020
const timeStep = 2629746;
const mnemonicWordsLen = 14;
const mnemonicErrorCorrectionWordsLen = 1;

class Seed {

  constructor(reserved, birthday, privateKeySeed, coinFlag, parseMnemonicResult) {
    this.reserved = reserved;
    this.birthday = birthday;
    this.privateKeySeed = privateKeySeed;
    this.coinFlag = coinFlag;
    this.parseMnemonicResult = parseMnemonicResult;
  }
  equals(a) {
    if(!a) return false;
    return a.reserved.eq(this.reserved)
      && a.birthday.eq(this.birthday)
      && a.privateKeySeed.eq(this.privateKeySeed)
      && a.coinFlag == this.coinFlag;
  }

  static quantizeTimestamp(t) {
    return new BN(Math.floor((t-epoch)/timeStep));
  }
  static unquantizeTimestamp(t) {
    return (t*timeStep+epoch);
  }
  static unquantizeTimestampToDateObj(t) {
    return new Date(Seed.unquantizeTimestamp(t)*1000);
  }

  getSalt() {
    let prefix = new TextEncoder().encode('Monero 14-word seed');
    return concatTypedArrays(concatTypedArrays(prefix, BNToUint8Array(this.reserved, 1)), BNToUint8Array(this.birthday, Math.ceil(10/8)));
  }
  derivePrivateKey() {
    let derivedKey = crypto.pbkdf2Sync(BNToUint8Array(this.privateKeySeed, 128/8), this.getSalt(), 4096, 32, 'sha256');
    return derivedKey;
  }
  derivePrivateKeyHex() {
    return Buffer.from(this.derivePrivateKey()).toString("hex");
  }

  static unflag(flaggedDataInt32Array, coinFlag) {
    let r = flaggedDataInt32Array.slice();
    r[1] = ((r[1] + coinFlag) % 2048);
    return r;
  }
  static flag(unflaggedDataInt32Array, coinFlag) {
    let r = unflaggedDataInt32Array.slice();
    r[1] = ((r[1] + 2048 - coinFlag) % 2048);
    return r;
  }
  static parseMnemonic(s, coinFlag) {

    let flaggedDataInt32Array = new Int32Array(mnemonicWordsLen);

    let result = {
      mnemonicUsable: false, // if true, that means either the seed was perfecly valid, or we were able to repair it
      specifiedMnemonicWordString: s, // the original seed parsed, prior to any repair operations
      state: undefined // will be one of: notEnoughWords, tooManyWords, tooManyUnrecognizedWords, repaired, specifiedSeedIsValid, reedSolomonCheckFailed
    };

    let words = s.replace(/ +(?= )/g,'').toLowerCase().trim().split(' '); // remove double spaces, convert to lowercase, trim and split into array of words
    if(words.length<mnemonicWordsLen) {
      result.state = 'notEnoughWords';
      result.errorMsg = 'Only ' + words.length + ' word(s) present';
      return result;
    }
    if(words.length>mnemonicWordsLen) {
      result.state = 'tooManyWords';
      result.errorMsg = words.length + ' words present';
      return result;
    }

    for(let i=0; i<words.length; i++) {
      let wordIndex = -1;
      for(let j=0; j<2048; j++) if(electrumWords.en[j]==words[i]) {
        wordIndex = j;
        break;
      }
      if(wordIndex==-1) {
        if(!result.hasOwnProperty('erasureIndex')) {
          result.erasureIndex = i;
          result.detectedErasureWord = words[i];
        }
        else {
          // erasureIndex was already set, which means we've encountered a second invalid word
          result.state = 'tooManyUnrecognizedWords';
          result.errorMsg = 'More than one unrecognized word found. Cannot repair.';
          return result;
        }
      }
      flaggedDataInt32Array[i] = wordIndex;
    }
    let unflaggedDataInt32Array = Seed.unflag(flaggedDataInt32Array, coinFlag);

    if(result.hasOwnProperty('erasureIndex')) {
      let repairedUnflaggedDataInt32Array = reedSolomonRepair(unflaggedDataInt32Array, result.erasureIndex);
      result.erasureWordReplacement = electrumWords.en[repairedUnflaggedDataInt32Array[result.erasureIndex]];
      result.state = 'repaired';
      result.validUnflaggedDataInt32Array = repairedUnflaggedDataInt32Array;
      result.mnemonicUsable = true;
    }
    else {
      result.validUnflaggedDataInt32Array = unflaggedDataInt32Array;
      result.state = 'specifiedSeedIsValid';
      result.mnemonicUsable = true;
    }
    if(!reedSolomonCheck(result.validUnflaggedDataInt32Array)) {
      result.state = 'reedSolomonCheckFailed';
      result.mnemonicUsable = false;
    }
    return result;
  }
  static unflaggedDataInt32ArrayToMnemonic(unflaggedDataInt32Array, coinFlag) {
    let flaggedDataInt32Array = Seed.flag(unflaggedDataInt32Array, coinFlag);
    return flaggedDataInt32Array.reduce((a,b)=>a+' '+electrumWords.en[b], '').trim();
  }
  static unflaggedDataInt32ArrayToBN(a) {
    let n = new BN(0);
    for(let i=0; i<a.length; i++) n.imuln(2048).iaddn(a[i]);
    return n;
  }
  static fromMnemonic(specifiedMnemonicWordString, coinFlag) {
    // 5 bits reserved for future use
    // 10 bits for approximate wallet birthday
    // 128 bits for the private key seed
    // 11 bits for checksum
    let parseMnemonicResult = Seed.parseMnemonic(specifiedMnemonicWordString, coinFlag);

    if(parseMnemonicResult.mnemonicUsable) {
      let data = Seed.unflaggedDataInt32ArrayToBN(parseMnemonicResult.validUnflaggedDataInt32Array);
      let payload = data.ushrn(11);
      let checksum = data.maskn(11);
      let reserved = payload.ushrn(10 + 128);
      let birthday = payload.ushrn(128).maskn(10);
      let privateKeySeed = payload.maskn(128);
      return new Seed(reserved, birthday, privateKeySeed, coinFlag, parseMnemonicResult);
    }
    else {
      return new Seed(undefined, undefined, undefined, coinFlag, parseMnemonicResult);
    }

  }
  toMnemonic() {
    let payload = this.reserved.ushln(10).add(this.birthday).ushln(128).add(this.privateKeySeed);
    let payloadLen = mnemonicWordsLen-1;
    let payloadInt32Array = new Int32Array(payloadLen);
    for(let i=0; i<payloadLen; i++) {
      let p = payloadLen-(i+1);
      payloadInt32Array[p] = payload.maskn((i+1)*11).ushrn(11*i);
    }
    let unflaggedDataInt32Array = concatTypedArrays(payloadInt32Array, new Uint32Array(1));
    unflaggedDataInt32Array = reedSolomonEncode(unflaggedDataInt32Array);
    let s = Seed.unflaggedDataInt32ArrayToMnemonic(unflaggedDataInt32Array, this.coinFlag);

    // do sanity check to see if we can parse the mnemonic we've just created
    var sanityCheckResult = Seed.parseMnemonic(s, this.coinFlag);
    if(sanityCheckResult.state!='specifiedSeedIsValid') {
      console.log(sanityCheckResult);
      throw 'Sanity check failed. Cannot parse generated mnemonic';
    }

    return s;
  }
  toString() {
    let s = '';
    s += 'coinFlag: 0x' + this.coinFlag.toString(16) + '\n';
    if(!this.parseMnemonicResult || (this.parseMnemonicResult && this.parseMnemonicResult.mnemonicUsable)) {
      s += 'reserved: ' + this.reserved + '\n';
      s += 'quantized birthday: ' + this.birthday + '\n';
      s += 'unquantized birthday: ' + Seed.unquantizeTimestampToDateObj(this.birthday).toUTCString() + '\n';
      s += 'privateKeySeedHex: ' + this.privateKeySeed.toString("hex") + '\n';
    }
    if(this.parseMnemonicResult) {
      s += 'parseMnemonicResult.mnemonicUsable: ' + this.parseMnemonicResult.mnemonicUsable + '\n';
      s += 'parseMnemonicResult.state: ' + this.parseMnemonicResult.state + '\n';
      if(this.parseMnemonicResult.state!='specifiedSeedIsValid') {
        s += 'parseMnemonicResult.erasureIndex: ' + this.parseMnemonicResult.erasureIndex + '\n';
        s += 'parseMnemonicResult.detectedErasureWord: ' + this.parseMnemonicResult.detectedErasureWord + '\n';
        s += 'parseMnemonicResult.erasureWordReplacement: ' + this.parseMnemonicResult.erasureWordReplacement + '\n';
      }
    }
    return s;
  }
  static randomSeed(reserved, creationTimestamp, coinFlag) {
    let birthday = Seed.quantizeTimestamp(creationTimestamp);
    let privateKeySeed = new BN(crypto.randomBytes(128/8));
    return new Seed(new BN(reserved), birthday, privateKeySeed, coinFlag);
  }

}
Seed.MONERO_COINFLAG = 0x539;
Seed.AEON_COINFLAG = 0x201;


function BNToUint8Array(n, len) {
  let a = new Uint8Array(len);
  for(let i=0; i<len; i++) {
    let p = len-(i+1);
    a[p] = n.maskn((i+1)*8).ushrn(8*i);
  }
  return a;
}
function concatTypedArrays(a, b) {
  let c = new (a.constructor)(a.length + b.length);
  c.set(a, 0);
  c.set(b, a.length);
  return c;
}

const reedSolomonEncoder = new reedSolomon.ReedSolomonEncoder(new reedSolomon.GenericGF(2053, 2048, 1));
function reedSolomonEncode(unflaggedDataInt32Array) {
  let r = unflaggedDataInt32Array.slice();
  reedSolomonEncoder.encode(r, mnemonicErrorCorrectionWordsLen);
  return r;
}
function reedSolomonCheck(unflaggedDataInt32Array) {
  return unflaggedDataInt32Array.toString()==reedSolomonEncode(unflaggedDataInt32Array).toString();
}
function reedSolomonRepair(unflaggedDataInt32Array, erasureIndex) {
  let r = unflaggedDataInt32Array.slice();
  for(let i=0; i<2048; i++) {
    r[erasureIndex] = i;
    if(reedSolomonCheck(r)) return r;
  }
  throw 'This line should be unreachable';
}

module.exports = { Seed: Seed };
