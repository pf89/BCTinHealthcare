//Web3 instance
var Web3 = require('web3');
var provider = new Web3.providers.HttpProvider('http://10.50.0.3:22000');
var web3 = new Web3(provider);
//initialize truffle contract
var truffleContract = require("truffle-contract");
var registerContractJson = require("../build/contracts/Register.json");
var treatmentContractJson = require("../build/contracts/Treatment.json");
var authorizationContractJson = require("../build/contracts/Authorization.json");

module.exports = {

    //create address for user on Quorum
    createAddress: async function(password) {
        return await web3.eth.personal.newAccount(password);
    },

    //unlock account on quorum so that this account can sign and conduct transactions
    unlockAccount: async function(address, password) {
        return await web3.eth.personal.unlockAccount(address, password, 10000);
    },

    //send personal data ipfs hash to Quorum
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

    //Loop through all registered accounts on node
    checkIfAccountExists: async function(address) {
        //get all registered accounts from Quorum
        var arrayContainsAddress = await web3.eth.getAccounts();
        //Check if address is in list of addresses
        var isExisting = arrayContainsAddress.indexOf(address);
        if(isExisting !== -1) {return true;}
        else {return false;}
    },

    //call register smart contract to return ipfshash to address
    getTransactionForPersonalData: async function(userAddress) {
        // Instantiate a new truffle contract from the artifact
        var registerContract = truffleContract(registerContractJson);
        // Connect provider to interact with contract
        registerContract.setProvider(provider);
        //call contract function and add address and file hash to blockchain
        var deployedContract = await registerContract.deployed();
        return await deployedContract.getPersonalIPFSHash.call({from: userAddress});
    },

    //add treatment ipfs hash to Quorum
    addTreatment: async function(providerAddress, patientAddress, fileHash) {
        //Instantiate a new truffle contract from the artifact
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

    //return all treatments performed by a healthcare provider
    getTreatmentsforProvider: async function(providerAddress) {
        // Instantiate a new truffle contract from the artifact
        var treatmentContract = truffleContract(treatmentContractJson);
        // Connect provider to interact with contract
        treatmentContract.setProvider(provider);
        //call contract function and add address and file hash to blockchain
        var deployedContract = await treatmentContract.deployed();
        return await deployedContract.getAllTreatmentsForProvider.call({from: providerAddress});
    },

    //Go through each address in order to get the corresponding ipfs hash of the treatment.
    //This solution was chosen because there were problems returning byte arrays from smart contract.
    getTreatmentsforProviderIpfs: async function(providerAddress, counter) {
        // Instantiate a new truffle contract from the artifact
        var treatmentContract = truffleContract(treatmentContractJson);
        // Connect provider to interact with contract
        treatmentContract.setProvider(provider);
        //call contract function and file hash about treatment from smart contract
        var deployedContract = await treatmentContract.deployed();
        var ipfsTreatments = [];
        for (var i = 0; i < counter; i++) {
            var ipfs = await deployedContract.getAllTreatmentsForProviderIpfs.call(i, {from: providerAddress}).catch(ex => console.log(ex));
            ipfsTreatments.push(ipfs);
        }
        return ipfsTreatments;
    },

    //Go through each address in order to get the corresponding ipfs hash of the treatment a patient received.
    //This solution was chosen because there were problems returning byte arrays from smart contract.
    getTreatmentsforPatientIpfs: async function(patientAddress, counter) {
        // Instantiate a new truffle contract from the artifact
        var treatmentContract = truffleContract(treatmentContractJson);
        // Connect provider to interact with contract
        treatmentContract.setProvider(provider);
        //call contract function and get file hash about treatment from smart contract
        var deployedContract = await treatmentContract.deployed();
        var ipfsTreatments = [];
        for(var i = 0; i < counter; i++){
            var ipfs = await deployedContract.getAllTreatmentsForPatientIpfs.call(i, {from: patientAddress, gas: 9000000}).catch(ex => console.log(ex));
            ipfsTreatments.push(ipfs);
        }
            return ipfsTreatments;
    },

    //return all provided treatments for specific patient
    getTreatmentsfromPatient: async function(providerAddress, treatments, patientAddress) {
        //Instantiate a new truffle contract from the artifact
        var treatmentContract = truffleContract(treatmentContractJson);
        //Connect provider to interact with contract
        treatmentContract.setProvider(provider);
        var deployedContract = await treatmentContract.deployed();
        var ipfsTreatments = [];
        //loop through all provided treatemnts
        for(var i = 0; i < treatments.length; i++){
            //filter out these treatemtns which doesnt belong to the patient address
            if(patientAddress.toLowerCase() === treatments[i]) {
                var ipfs = await deployedContract.getAllTreatmentsForProviderIpfs.call(i, {
                    from: providerAddress,
                    gas: 9000000
                }).catch(ex => console.log(ex));
                ipfsTreatments.push(ipfs);
            }
        }
        return ipfsTreatments;
    },

    //Return all healthcare provider addresses from whom a patient received treatments
    getTreatmentsforPatient: async function(patientAddress) {
        // Instantiate a new truffle contract from the artifact
        var treatmentContract = truffleContract(treatmentContractJson);
        // Connect provider to interact with contract
        treatmentContract.setProvider(provider);
        //call contract function and get list of addresses
        var deployedContract = await treatmentContract.deployed();
        return await deployedContract.getAllTreatmentsForPatient.call({from: patientAddress});
    },

    //Return all treatment ipfs hashes from a specific provider
    getTreatmentsfromProvider: async function(patientAddress, treatments, providerAddress) {
        // Instantiate a new truffle contract from the artifact
        var treatmentContract = truffleContract(treatmentContractJson);
        // Connect provider to interact with contract
        treatmentContract.setProvider(provider);
        var deployedContract = await treatmentContract.deployed();
        var ipfsTreatments = [];
        //loop through all provided treatemnts
        for(var i = 0; i < treatments.length; i++){
            //filter out these treatemtns which doesnt belong to the provider address
            if(providerAddress.toLowerCase() === treatments[i]) {
                var ipfs = await deployedContract.getAllTreatmentsForPatientIpfs.call(i, {
                    from: patientAddress,
                    gas: 9000000
                }).catch(ex => console.log(ex));
                ipfsTreatments.push(ipfs);
            }
        }

        return ipfsTreatments;
    },

    //store authorization on Quorum - Mapping healthcare provider address to patient address
    addAuthorizaiton: async function(providerAddress, patientAddress) {
        //Instantiate a new truffle contract from the artifact
        var authorizationContract = truffleContract(authorizationContractJson);
        //Connect provider to interact with contract
        authorizationContract.setProvider(provider);
        //call contract function and add address and file hash to blockchain
        authorizationContract.deployed().then(function (instance) {
            instance.addAuthorization(patientAddress.toLowerCase(), {from: providerAddress, gas: 90000000}).then(res => {
                if (res) console.log(res);
            }).catch(err => console.log(err));
        });
    },

    //return patient addreess list of authorizations for healthcare provider
    getAuthorizaitonProvider: async function(pAddress) {
        // Instantiate a new truffle contract from the artifact
        var authorizationContract = truffleContract(authorizationContractJson);
        // Connect provider to interact with contract
        authorizationContract.setProvider(provider);
        //call contract function and add address and file hash to blockchain
        var deployedContract = await authorizationContract.deployed();
        var patientAddresses = await deployedContract.getAuthorizedAdressesProvider.call(pAddress, {
            from: pAddress,
            gas: 9000000
        }).catch(ex => console.log(ex));
        //return array of patient addresses
        return patientAddresses;
    },

    //return healthcare provier addreess list of authorizations for patient
    getAuthorizaitonPatient: async function(pAddress) {
        // Instantiate a new truffle contract from the artifact
        var authorizationContract = truffleContract(authorizationContractJson);
        // Connect provider to interact with contract
        authorizationContract.setProvider(provider);
        //call contract function and add address
        var deployedContract = await authorizationContract.deployed();
        var providerAddresses = await deployedContract.getAuthorizedAdressesPatient.call(pAddress, {
            from: pAddress,
            gas: 9000000
        }).catch(ex => console.log(ex));
        //return array of provider addresses
        return providerAddresses;
    },

    //return is provider authorized
    isAuthorized: async function(patientAddress, providerAddress) {
        // Instantiate a new truffle contract from the artifact
        var authorizationContract = truffleContract(authorizationContractJson);
        // Connect provider to interact with contract
        authorizationContract.setProvider(provider);
        //call contract function
        var deployedContract = await authorizationContract.deployed();
        var authorized = await deployedContract.isAuthorized.call(patientAddress, {
            from: providerAddress,
            gas: 9000000
        }).catch(ex => console.log(ex));
        //return true or false
        return authorized;
    },

    //Add new personal data hash to Quorum for user
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

};