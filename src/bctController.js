//Web3 instance
var Web3 = require('web3');
var provider = new Web3.providers.HttpProvider('http://10.50.0.3:22000');
var web3 = new Web3(provider);
//initialize truffle contract
var truffleContract = require("truffle-contract");
var registerContractJson = require("../build/contracts/Register.json");
var treatmentContractJson = require("../build/contracts/Treatment.json");
var autorizationContractJson = require("../build/contracts/Autorisation.json");

module.exports = {

////////////////////////////////////////////////////////////////////////////////////////////
//----Create account data----//////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
    createAddress: async function(password) {
        return await web3.eth.personal.newAccount(password);
    },

    unlockAccount: async function(address, password) {
        return await web3.eth.personal.unlockAccount(address, password, 10000);
    },

    addUser: async function(userAddress, fileHash) {
        // Instantiate a new truffle contract from the artifact
        var registerContract = truffleContract(registerContractJson);
        // Connect provider to interact with contract
        registerContract.setProvider(provider);
        //call contract function and add address and file hash to blockchain
        registerContract.deployed().then(function (instance) {
            instance.addUserAddress(fileHash, {from: userAddress}).then(res => {
                if (res) console.log(res);
            }).catch(err => console.log(err));
        });
    },

    editUser: async function(userAddress, fileHash) {
        // Instantiate a new truffle contract from the artifact
        var registerContract = truffleContract(registerContractJson);
        // Connect provider to interact with contract
        registerContract.setProvider(provider);
        //call contract function and add address and file hash to blockchain
        registerContract.deployed().then(function (instance) {
            instance.editUser(fileHash, {from: userAddress}).then(res => {
                if (res) console.log(res);
            }).catch(err => console.log(err));
        });
    },

    getTransactionForPersonalData: async function(userAddress) {
        // Instantiate a new truffle contract from the artifact
        var registerContract = truffleContract(registerContractJson);
        // Connect provider to interact with contract
        registerContract.setProvider(provider);
        //call contract function and add address and file hash to blockchain
        var deployedContract = await registerContract.deployed();
        return await deployedContract.getPersonalIPFSHash.call({from: userAddress});
    },

    addTreatment: async function(providerAddress, patientAddress, fileHash) {
        // Instantiate a new truffle contract from the artifact
        var treatmentContract = truffleContract(treatmentContractJson);
        // Connect provider to interact with contract
        treatmentContract.setProvider(provider);
        //call contract function and add address and file hash to blockchain
        treatmentContract.deployed().then(function (instance) {
            instance.addTreatment(patientAddress, fileHash, {from: providerAddress, gas: 90000000}).then(res => {
                if (res) console.log(res);
            }).catch(err => console.log(err));
        });
    },

    getTreatmentsforPatient: async function(patientAddress) {
        // Instantiate a new truffle contract from the artifact
        var treatmentContract = truffleContract(treatmentContractJson);
        // Connect provider to interact with contract
        treatmentContract.setProvider(provider);
        //call contract function and add address and file hash to blockchain
        var deployedContract = await treatmentContract.deployed();
        return await deployedContract.getAllTreatmentsForPatient.call({from: patientAddress});
    },

    getTreatmentsforProvider: async function(providerAddress) {
        // Instantiate a new truffle contract from the artifact
        var treatmentContract = truffleContract(treatmentContractJson);
        // Connect provider to interact with contract
        treatmentContract.setProvider(provider);
        //call contract function and add address and file hash to blockchain
        var deployedContract = await treatmentContract.deployed();
        return await deployedContract.getAllTreatmentsForProvider.call({from: providerAddress});
    },

    getTreatmentsforProviderIpfs: async function(providerAddress, counter) {
        // Instantiate a new truffle contract from the artifact
        var treatmentContract = truffleContract(treatmentContractJson);
        // Connect provider to interact with contract
        treatmentContract.setProvider(provider);
        //call contract function and add address and file hash to blockchain
        var deployedContract = await treatmentContract.deployed();
        var ipfsTreatments = [];
        for (var i = 0; i < counter; i++) {
            var ipfs = await deployedContract.getAllTreatmentsForProviderIpfs.call(i, {from: providerAddress}).catch(ex => console.log(ex));
            ipfsTreatments.push(ipfs);
        }
        return ipfsTreatments;
    },

    getTreatmentsforPatientIpfs: async function(patientAddress, counter) {
        // Instantiate a new truffle contract from the artifact
        var treatmentContract = truffleContract(treatmentContractJson);
        // Connect provider to interact with contract
        treatmentContract.setProvider(provider);
        //call contract function and add address and file hash to blockchain
        var deployedContract = await treatmentContract.deployed();
        var ipfsTreatments = [];
        for(var i = 0; i < counter; i++){
            var ipfs = await deployedContract.getAllTreatmentsForPatientIpfs.call(i, {from: patientAddress, gas: 9000000}).catch(ex => console.log(ex));
            ipfsTreatments.push(ipfs);
        }

            return ipfsTreatments;
    },

    getTreatmentsfromProvider: async function(patientAddress, treatments, providerAddress) {
        // Instantiate a new truffle contract from the artifact
        var treatmentContract = truffleContract(treatmentContractJson);
        // Connect provider to interact with contract
        treatmentContract.setProvider(provider);
        //call contract function and add address and file hash to blockchain
        var deployedContract = await treatmentContract.deployed();
        var ipfsTreatments = [];
        for(var i = 0; i < treatments.length; i++){
            if(providerAddress === treatments[i]) {
                var ipfs = await deployedContract.getAllTreatmentsForPatientIpfs.call(i, {
                    from: patientAddress,
                    gas: 9000000
                }).catch(ex => console.log(ex));
                ipfsTreatments.push(ipfs);
            }
        }

        return ipfsTreatments;
    },

    getTreatmentsfromPatient: async function(providerAddress, treatments, patientAddress) {
        // Instantiate a new truffle contract from the artifact
        var treatmentContract = truffleContract(treatmentContractJson);
        // Connect provider to interact with contract
        treatmentContract.setProvider(provider);
        //call contract function and add address and file hash to blockchain
        var deployedContract = await treatmentContract.deployed();
        var ipfsTreatments = [];
        for(var i = 0; i < treatments.length; i++){
            if(patientAddress === treatments[i]) {
                var ipfs = await deployedContract.getAllTreatmentsForProviderIpfs.call(i, {
                    from: providerAddress,
                    gas: 9000000
                }).catch(ex => console.log(ex));
                ipfsTreatments.push(ipfs);
            }
        }

        return ipfsTreatments;
    },

    checkIfAccountExists: async function(address) {
        var arrayContainsAddress = await web3.eth.getAccounts();
        var isExisting = arrayContainsAddress.indexOf(address);
        if(isExisting !== -1) {return true;}
            else {return false;}
    },

    addAutorizaiton: async function(providerAddress, patientAddress) {
        // Instantiate a new truffle contract from the artifact
        var autorizationContract = truffleContract(autorizationContractJson);
        // Connect provider to interact with contract
        autorizationContract.setProvider(provider);
        //call contract function and add address and file hash to blockchain
        autorizationContract.deployed().then(function (instance) {
            instance.addAutorisation(patientAddress, {from: providerAddress, gas: 90000000}).then(res => {
                if (res) console.log(res);
            }).catch(err => console.log(err));
        });
    },

    getAutorizaitonProvider: async function(pAddress) {
        // Instantiate a new truffle contract from the artifact
        var autorizationContract = truffleContract(autorizationContractJson);
        // Connect provider to interact with contract
        autorizationContract.setProvider(provider);
        //call contract function and add address and file hash to blockchain
        var deployedContract = await autorizationContract.deployed();
        var patientAddresses = await deployedContract.getAutorizedAdressesProvieder.call(pAddress, {
            from: pAddress,
            gas: 9000000
        }).catch(ex => console.log(ex));
        return patientAddresses;
    },

    getAutorizaitonPatient: async function(pAddress) {
        // Instantiate a new truffle contract from the artifact
        var autorizationContract = truffleContract(autorizationContractJson);
        // Connect provider to interact with contract
        autorizationContract.setProvider(provider);
        //call contract function and add address and file hash to blockchain
        var deployedContract = await autorizationContract.deployed();
        var providerAddresses = await deployedContract.getAutorizedAdressesPatient.call(pAddress, {
            from: pAddress,
            gas: 9000000
        }).catch(ex => console.log(ex));
        return providerAddresses;
    },
};