# Monero 14-word seed javascript library

Javascript version of https://github.com/tevador/monero-seed

## To install dependencies (nodejs and javascript libraries):
```
sudo apt install nodejs
npm install bn.js reedsolomon
```

## To run tests: (look at test/test.js for guidance on how to use Seed class)
```
node test/test
```

## To restore a seed:
```
var seed = Seed.fromMnemonic(mnemonic, Seed.MONERO_COINFLAG).toString();
console.log(seed.toString();

seed.parseMnemonicResult.mnemonicUsable // if true, that means either the seed was perfectly valid, or we were able to repair it
seed.parseMnemonicResult.state          // will be one of:
                                        //   notEnoughWords           (fewer than 14 words specified)
                                        //   tooManyWords             (more than 14 words specified)
                                        //   repaired                 (one of the 14 words was unrecognized, and the seed was automatically repaired)
                                        //   tooManyUnrecognizedWords (more than one word was unrecognized, and the seed cannot therefore be repaired)
                                        //   specifiedSeedIsValid     (the mnemonic specified passed the Reed Solomon test, and did not need to be repaired)
                                        //   reedSolomonCheckFailed   (all words specified were valid words, but the Reed Solomon test failed)
seed.specifiedMnemonicWordString        // the mnemonic passed in, which may end up being different than the repaired mnemonic
seed.erasureIndex                       // if a word was unrecognized (i.e. not in the list of possible electrum words), the index of the unrecognized word
seed.detectedErasureWord                // the word that was unrecognized
seed.erasureWordReplacement             // the replacement word switched with the unrecognized word in the originally specified mnemonic
seed.privateKeySeed                     // the 128-bit private key seed
seed.getSalt()                          // the 25-byte salt used when applying 4096 rounds of pbkdf-hmac-sha256 to the privateKeySeed to derive the private key
seed.derivePrivateKeyHex()              // the 256-bit private key
```

## To create a random seed with reserved bits=0:
```
var seed = Seed.randomSeed(0, new Date('2030-01-01' + 'T00:00:00.000Z').getTime() / 1000, Seed.MONERO_COINFLAG);
console.log(seed.toString();

// since the seed was created and not parsed, there will be no seed.parseMnemonicResult object present.
```


