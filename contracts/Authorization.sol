pragma solidity 0.4.24;

import "./Register.sol";

contract Authorization {

    address registerContract;

    constructor(address register) public {
        registerContract = register;
    }
    //mapping to check the authorization for the provider
    mapping(address => address[]) private authorizationProvider;

    //mapping to check the authorization for the patient
    mapping(address => address[]) private authorizationPatient;

    //provider add authorization
    function addAuthorization(address _patientAddress) public {
        Register register = Register(registerContract);
        //get ipfs hash for patient and provider to check if they are already registered
        string memory _ipfsHashPatient = register.getPersonalIPFSHashForProvider(_patientAddress);
        string memory _ipfsHashProvider = register.getPersonalIPFSHashForProvider(msg.sender);
        require(bytes(_ipfsHashPatient).length > 0 && bytes(_ipfsHashProvider).length > 0);
        //check if relationship doesnt exist
        require(!isAuthorized(_patientAddress));
        //Add mapping in both directions patient - provider and provider - patient
        authorizationProvider[msg.sender].push(_patientAddress);
        authorizationPatient[_patientAddress].push(msg.sender);
    }

    //get back an array of authorized addresses from provider
    function getAuthorizedAdressesProvider(address _providerAddress) public view returns(address[]){
        return authorizationProvider[_providerAddress];
    }

    //get back an array of authorized addresses forom patient
    function getAuthorizedAdressesPatient(address _patientAddress) public view returns(address[]){
        return authorizationPatient[_patientAddress];
    }

    //check if provider is authorized
    function isAuthorized(address _patientAddress) public view returns(bool){
        for (uint i=0; i < authorizationProvider[msg.sender].length; i++) {
            if(authorizationProvider[msg.sender][i] == _patientAddress){
                return true;
            }
        }
        return false;
    }

    //check if provider is authorized
    function isAuthorizedTreatment(address _provider, address _patientAddress) public view returns(bool){
        for (uint i=0; i < authorizationProvider[_provider].length; i++) {
            if(authorizationProvider[_provider][i] == _patientAddress){
                return true;
            }
        }
        return false;
    }
}