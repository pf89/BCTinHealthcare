var Web3 = require('web3');
var TruffleConfig= require('../truffle');
var Migrations = artifacts.require("./Migrations.sol");

module.exports = function(deployer) {
    const config = TruffleConfig.networks['development'];


    const web3 = new Web3(new Web3.providers.HttpProvider('http://' + config.host + ':' + config.port));

    console.log('>> Unlocking account ' + config.from);
    web3.eth.personal.unlockAccount(config.from, '', 36000);


    console.log('>> Deploying migration');
    deployer.deploy(Migrations);
};