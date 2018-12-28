pragma solidity 0.4.24;

import "./Register.sol";

contract Autorisation {

    address registerContract;

    constructor(address register) public {
        registerContract = register;
    }
    //mapping to check the autorisation for the provider
    mapping(address => address[]) private autorisationProvider;

    //mapping to check the autorisation for the patient
    mapping(address => address[]) private autorisationPatient;

    //provider add autorisation
    function addAutorisation(address _patientAddress) public {
        Register register = Register(registerContract);
        //get ipfs hash for patient and provider to check if they are already registered
        string memory _ipfsHashPatient = register.getPersonalIPFSHashForProvider(_patientAddress);
        string memory _ipfsHashProvider = register.getPersonalIPFSHashForProvider(msg.sender);
        require(bytes(_ipfsHashPatient).length > 0 && bytes(_ipfsHashProvider).length > 0);
        //check if relationship doesnt exist
        require(!isAutorized(_patientAddress));
        //Add mapping in both directions patient - provider and provider - patient
        autorisationProvider[msg.sender].push(_patientAddress);
        autorisationPatient[_patientAddress].push(msg.sender);
    }

    //get back an array of autorized addresses from provider
    function getAutorizedAdressesProvieder(address _providerAddress) public view returns(address[]){
        return autorisationProvider[_providerAddress];
    }

    //get back an array of autorized addresses forom patient
    function getAutorizedAdressesPatient(address _patientAddress) public view returns(address[]){
        return autorisationPatient[_patientAddress];
    }

    //check if provider is autorized
    function isAutorized(address _patientAddress) public view returns(bool){
        for (uint i=0; i < autorisationProvider[msg.sender].length; i++) {
            if(autorisationProvider[msg.sender][i] == _patientAddress){
                return true;
            }
        }
        return false;
    }

    //check if provider is autorized
    function isAutorizedTreatment(address _provider, address _patientAddress) public view returns(bool){
        for (uint i=0; i < autorisationProvider[_provider].length; i++) {
            if(autorisationProvider[_provider][i] == _patientAddress){
                return true;
            }
        }
        return false;
    }
}