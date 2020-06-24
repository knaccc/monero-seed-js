# Monero 14-word seed javascript library

Javascript version of https://github.com/tevador/monero-seed

### To install dependencies (nodejs and javascript libraries):
```
sudo apt install nodejs
npm install bn.js reedsolomon
```

### To run tests: (look at test/test.js for guidance on how to use Seed class)
```
node test/test
```

### To restore a seed:
```
var seed = Seed.fromMnemonic(mnemonic, Seed.MONERO_COINFLAG);
console.log(seed.toString());

seed.derivePrivateKeyHex()   // the 256-bit private key
seed.getBirthdayDate()       // a javascript Date object representation of the seed birthday
seed.getCoinFlag()           // the coinFlag used, as a javascript number (Seed.MONERO_COINFLAG or Seed.AEON_COINFLAG)
seed.getReserved()           // the reserved bits, as a javascript number
seed.deriveSalt()            // the 25-byte salt used when applying 4096 rounds of PBKDF2-HMAC-SHA256 to the privateKeySeed to derive the private key
seed.getQuantizedBirthday()  // the quantized representation of the seed birthday

seed.getParseResult() properties:
  .mnemonicUsable // if true, that means either the seed was perfectly valid, or we were able to repair it
  .state          // will be one of:
                  //   notEnoughWords           (fewer than 14 words specified)
                  //   tooManyWords             (more than 14 words specified)
                  //   repaired                 (one of the 14 words was unrecognized, and the seed was automatically repaired)
                  //   tooManyUnrecognizedWords (more than one word was unrecognized, and the seed cannot therefore be repaired)
                  //   specifiedSeedIsValid     (the mnemonic specified passed the Reed Solomon test, and did not need to be repaired)
                  //   reedSolomonCheckFailed   (all words specified were valid words, but the Reed Solomon test failed)
  .specifiedMnemonicWordString  // the mnemonic passed in, which may end up being different than the repaired mnemonic
  .erasureIndex                 // if a word was unrecognized (i.e. not in the list of possible electrum words), the index of the unrecognized word
  .detectedErasureWord          // the word that was unrecognized
  .erasureWordReplacement       // the replacement word switched with the unrecognized word in the originally specified mnemonic
  .privateKeySeed               // the 128-bit private key seed
```

### To create a random seed with reserved bits=0:
```
var seed = Seed.randomSeed(0, new Date('2030-01-01' + 'T00:00:00.000Z').getTime() / 1000, Seed.MONERO_COINFLAG);
console.log(seed.toString();

// since the seed was created and not parsed, there will be no seed.parseMnemonicResult object present.
```


