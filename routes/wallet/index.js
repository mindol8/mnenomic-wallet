var express = require('express');
var router = express.Router();
const lightwallet = require("eth-lightwallet");
const fs = require('fs');
const crypto = require("crypto");

let accountFromMnemonic = {};
let addressFromAccount = {};
router.post('/newMnemonic', async (req, res) => {
    let mnemonic;
    try {
        mnemonic = lightwallet.keystore.generateRandomSeed();
        const hashed = String(crypto.createHash('sha256').update(mnemonic).digest('hex'));
        accountFromMnemonic[hashed] = accountFromMnemonic[hashed] || 0;
        const _hashed = crypto.createHash('sha256').update(mnemonic + String(accountFromMnemonic[hashed])).digest('hex');
        addressFromAccount[_hashed] = addressFromAccount[_hashed] || 0;
        res.json({ mnemonic });
    } catch (error) {
        console.log(error);
    }
});


router.post('/newWallet', async (req, res) => {
    const password = req.body.password
    const mnemonic = req.body.mnemonic;
    let coinType = req.body.coinType || 0; //default로 bitcoin
    let keyType = req.body.keyType || 'm'; //default로 개인키, M은 공개키
    let isBalanceAccount = req.body.isBalanceAccount || true; //default로 잔액계정
    let newAccount = req.body.newAccount || "true";

    try {
        let _isBalanceAccount = isBalanceAccount ? 1 : 0;// default로 잔액계정(1), 일반계정은 (0)
        const hashedKey = String(crypto.createHash('sha256').update(mnemonic).digest('hex'));
        const _hashedKey = crypto.createHash('sha256').update(mnemonic + String(accountFromMnemonic[hashedKey])).digest('hex');
        let _keyType = keyType === "public" ? "M" : "m";
        let accountIdx = accountFromMnemonic[hashedKey] || 0;
        let addressIdx = addressFromAccount[_hashedKey] || 0;
        let _newAccount = newAccount === "true" ? true : false;
        let hdPathString = `${_keyType}/44'/${coinType}'/${accountIdx}'/${_isBalanceAccount}/${addressIdx}`;

        if (_newAccount) {
            if (accountFromMnemonic[hashedKey] === 0) {
                addressFromAccount[_hashedKey] = 0;
            }
            accountFromMnemonic[hashedKey]++;
        } else {
            addressFromAccount[_hashedKey] = addressFromAccount[_hashedKey] + 1 || 0;
        }
        console.log(accountFromMnemonic, addressFromAccount)
        lightwallet.keystore.createVault({
            password: password,
            seedPhrase: mnemonic,
            hdPathString: hdPathString
        },
            function (err, ks) {
                ks.keyFromPassword(password, function (err, pwDerivedKey) {
                    ks.generateNewAddress(pwDerivedKey, 1);
                    let address = (ks.getAddresses()).toString();
                    let keystore = ks.serialize();
                    fs.writeFile(`./keyStores/${hashedKey.slice(0, 20)}_${accountFromMnemonic[hashedKey] || 0}_${addressFromAccount[_hashedKey] || 0}_wallet.json`, keystore, function (err, data) {
                        if (err) {
                            res.json({ code: 999, message: "실패" });
                        } else {
                            res.json({ code: 1, message: "성공", address });
                        }
                    });
                });
            }
        );
    } catch (exception) {
        console.log("NewWallet ==>>>> " + exception);
    }
});

module.exports = router;