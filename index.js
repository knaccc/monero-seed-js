const reedSolomon = require('reedsolomon');
const crypto = require('crypto');
const BN = require('bn.js');
const electrumWords = require('./electrum-words').electrumWords;

const epoch = 1590969600; //1st June 2020
const timeStep = 2629746; //30.436875 days = 1/12 of the Gregorian year
const mnemonicWordsLen = 14;
const mnemonicErrorCorrectionWordsLen = 1;

class Seed {

  constructor(reserved, birthday, privateKeySeed, coinFlag, parseResult) {
    this.reserved = reserved;
    this.birthday = birthday;
    this.privateKeySeed = privateKeySeed;
    this.coinFlag = coinFlag;
    this.parseResult = parseResult;
  }
  getReserved() {
    return this.reserved.toNumber();
  }
  getQuantizedBirthday() {
    return this.birthday.toNumber();
  }
  getCoinFlag() {
    return this.coinFlag;
  }
  getParseResult() {
    if(!this.parseResult) throw 'This seed was not created by parsing a mnemonic';
    return this.parseResult;
  }
  getPrivateKeySeed() {
    return this.privateKeySeed;
  }

  equals(a) {
    if(!a) return false;
    return a.reserved.eq(this.reserved)
      && a.birthday.eq(this.birthday)
      && a.privateKeySeed.eq(this.privateKeySeed)
      && a.coinFlag === this.coinFlag;
  }

  static quantizeTimestamp(t) {
    if(t<epoch) throw 'Date cannot be before epoch date (1st June 2020)';
    return new BN(Math.floor((t-epoch)/timeStep));
  }
  static unquantizeTimestamp(t) {
    return (t*timeStep+epoch);
  }
  static unquantizeTimestampToDate(t) {
    return new Date(Seed.unquantizeTimestamp(t)*1000);
  }
  deriveSalt() {
    let prefix = new TextEncoder().encode('Monero 14-word seed\0');
    return concatTypedArrays(concatTypedArrays(prefix, BNToUint8Array(this.reserved, 1)), BNToUint8Array(this.birthday, 4).reverse());
  }
  derivePrivateKey() {
    return crypto.pbkdf2Sync(BNToUint8Array(this.privateKeySeed, 128/8), this.deriveSalt(), 4096, 32, 'sha256');
  }
  derivePrivateKeyHex() {
    return Buffer.from(this.derivePrivateKey()).toString("hex");
  }

  static flag(array, coinFlag) {
    let r = array.slice();
    r[1] = r[1]^coinFlag;
    return r;
  }
  static unflag(unflaggedDataInt32Array, coinFlag) {
    return Seed.flag(unflaggedDataInt32Array, coinFlag); // flagging process is symmetrical, since it's XOR
  }
  static parseMnemonic(s, coinFlag) {

    let flaggedDataInt32Array = new Int32Array(mnemonicWordsLen);

    let result = {
      mnemonicUsable: false, // if true, that means either the seed was perfectly valid, or we were able to repair it
      specifiedMnemonicWordString: s, // the original seed parsed, prior to any repair operations
      state: undefined // will be one of: notEnoughWords, tooManyWords, tooManyUnrecognizedWords, repaired, specifiedSeedIsValid, reedSolomonCheckFailed
    };

    let words = s.replace(/ +(?= )/g,'').toLowerCase().trim().split(' '); // remove double spaces, convert to lowercase, trim and split into array of words
    if(words.length<mnemonicWordsLen) {
      result.state = 'notEnoughWords';
      return result;
    }
    if(words.length>mnemonicWordsLen) {
      result.state = 'tooManyWords';
      return result;
    }

    for(let i=0; i<words.length; i++) {
      let wordIndex = electrumWords.en.findIndex(w=>w===words[i]);
      if(wordIndex===-1) {
        if(!result.hasOwnProperty('erasureIndex')) {
          result.erasureIndex = i;
          result.detectedErasureWord = words[i];
        }
        else {
          // erasureIndex was already set, which means we've encountered a second invalid word and cannot repair
          result.state = 'tooManyUnrecognizedWords';
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
  static unflaggedPayloadInt32ArrayToBN(a) {
    let n = new BN(0);
    for(let i=0; i<a.length; i++) n.iushln(11).iaddn(a[i]);
    return n;
  }
  static fromMnemonic(specifiedMnemonicWordString, coinFlag) {
    // 5 bits reserved for future use
    // 10 bits for approximate wallet birthday
    // 128 bits for the private key seed
    // 11 bits for checksum
    let parseResult = Seed.parseMnemonic(specifiedMnemonicWordString, coinFlag);

    if(parseResult.mnemonicUsable) {
      let payload = Seed.unflaggedPayloadInt32ArrayToBN(parseResult.validUnflaggedDataInt32Array.slice(1, 14));
      let reserved = payload.ushrn(10 + 128);
      let birthday = payload.ushrn(128).maskn(10);
      let privateKeySeed = payload.maskn(128);
      return new Seed(reserved, birthday, privateKeySeed, coinFlag, parseResult);
    }
    else {
      return new Seed(undefined, undefined, undefined, coinFlag, parseResult);
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
    let unflaggedDataInt32Array = reedSolomonEncode(payloadInt32Array);
    let s = Seed.unflaggedDataInt32ArrayToMnemonic(unflaggedDataInt32Array, this.coinFlag);

    // do sanity check to see if we can parse the mnemonic we've just created
    var sanityCheckResult = Seed.parseMnemonic(s, this.coinFlag);
    if(sanityCheckResult.state!=='specifiedSeedIsValid') {
      console.log(sanityCheckResult);
      throw 'Sanity check failed. Cannot parse generated mnemonic';
    }

    return s;
  }
  getBirthdayDate() {
    return Seed.unquantizeTimestampToDate(this.birthday);
  }
  toString() {
    let s = '';
    s += 'coinFlag: 0x' + this.coinFlag.toString(16) + '\n';
    if(!this.parseResult || (this.parseResult && this.parseResult.mnemonicUsable)) {
      s += 'reserved: ' + this.reserved + '\n';
      s += 'quantized birthday: ' + this.birthday + '\n';
      s += 'unquantized birthday: ' + this.getBirthdayDate().toUTCString() + '\n';
      s += 'privateKeySeedHex: ' + this.privateKeySeed.toString("hex") + '\n';
      s += 'salt: ' + Buffer.from(this.deriveSalt()).toString("hex") + '\n';
      s += 'mnemonic: ' + this.toMnemonic() + '\n';
      s += 'derivedPrivateKeyHex: ' + this.derivePrivateKeyHex() + '\n';
    }
    if(this.parseResult && this.parseResult.specifiedMnemonicWordString) {
      s += 'parseResult.specifiedMnemonicWordString: ' + this.parseResult.specifiedMnemonicWordString + '\n';
    }
    if(this.parseResult) {
      s += 'parseResult.mnemonicUsable: ' + this.parseResult.mnemonicUsable + '\n';
      s += 'parseResult.state: ' + this.parseResult.state + '\n';
      if(this.parseResult.state!=='specifiedSeedIsValid') {
        s += 'parseResult.erasureIndex: ' + this.parseResult.erasureIndex + '\n';
        s += 'parseResult.detectedErasureWord: ' + this.parseResult.detectedErasureWord + '\n';
        s += 'parseResult.erasureWordReplacement: ' + this.parseResult.erasureWordReplacement + '\n';
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
function reedSolomonEncode(unflaggedPayloadInt32Array) {
  // expects an array of 13 word indices. will return an array of 14 word indices, where the first is the checksum
  // for compatibility with C implementation, provide payload in reverse order to encoder
  let r = concatTypedArrays(unflaggedPayloadInt32Array.slice().reverse(), new Uint32Array(1));
  reedSolomonEncoder.encode(r, mnemonicErrorCorrectionWordsLen);
  r = concatTypedArrays(new Uint32Array([r[13]]),unflaggedPayloadInt32Array);
  return r;
}

function reedSolomonCheck(unflaggedDataInt32Array) {
  return unflaggedDataInt32Array.toString()===reedSolomonEncode(unflaggedDataInt32Array.slice(1, 14)).toString();
}
function reedSolomonRepair(unflaggedDataInt32Array, erasureIndex) {
  let r = unflaggedDataInt32Array.slice();
  for(let i=0; i<2048; i++) {
    r[erasureIndex] = i;
    if(reedSolomonCheck(r)) return r;
  }
  throw 'This line should be unreachable';
}

module.exports = { Seed };
