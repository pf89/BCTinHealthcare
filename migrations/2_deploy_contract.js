var Web3 = require('web3');
var TruffleConfig= require('../truffle');
var Register = artifacts.require("./Register.sol");
var Autorisation = artifacts.require("./Autorisation");
var Treatment = artifacts.require("./Treatment");

module.exports = function(deployer) {
    const config = TruffleConfig.networks['development'];

    const web3 = new Web3(new Web3.providers.HttpProvider('http://' + config.host + ':' + config.port));

    console.log('>> Unlocking account ' + config.from);
    web3.eth.personal.unlockAccount(config.from, '', 36000);


    console.log('>> Deploying migration');
    deployer.deploy(Register).then(_instance => {
         deployer.deploy(Autorisation, _instance.address).then(_instance2 => {
            deployer.deploy(Treatment, _instance2.address).then(instance3 => console.log(instance3.address));
        });
    });
};