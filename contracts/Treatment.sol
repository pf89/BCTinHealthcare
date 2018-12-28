pragma solidity 0.4.24;

import "./Autorisation.sol";

contract Treatment {

    address autorizationContract;
    constructor(address auto) public {
        autorizationContract = auto;
    }


    //create treatment
    struct TreatmentPatient{
        address patientAddress;
        string ipfsHash;
    }

    //create treatment
    struct TreatmentProvider{
        address providerAddress;
        string ipfsHash;
    }

    //mapping patient and provider address to treatment
    mapping(address => TreatmentPatient[]) private treatmentsProvider;
    mapping(address => TreatmentProvider[]) private treatmentsPatient;

    function addTreatment(address _patientAddress, string _ipfsHash) public {
        Autorisation auto = Autorisation(autorizationContract);
        require(auto.isAutorizedTreatment(msg.sender,_patientAddress));

        treatmentsProvider[msg.sender].push(TreatmentPatient(_patientAddress, _ipfsHash));
        treatmentsPatient[_patientAddress].push(TreatmentProvider(msg.sender, _ipfsHash));
    }

    //get address array back. Patient get all provider addresses which he get treatments from
    function getAllTreatmentsForPatient() public view returns(address[]){
        address[] memory providerAddresses = new address[](treatmentsPatient[msg.sender].length);
        for(uint i = 0; i < treatmentsPatient[msg.sender].length;  i++) {
            address a = treatmentsPatient[msg.sender][i].providerAddress;
            providerAddresses[i] = a;
        }

        return (providerAddresses);
    }

    //get bytes for ipfs hash links back (patient)
    function getAllTreatmentsForPatientIpfs(uint counter) public returns(string){
        return treatmentsPatient[msg.sender][counter].ipfsHash;
    }

    //get address array back. Provider get all patient addresses which the provider treatments
    function getAllTreatmentsForProvider() public view returns(address[]){
        address[] memory patientAddresses = new address[](treatmentsProvider[msg.sender].length);

        for(uint i = 0; i < treatmentsProvider[msg.sender].length;  i++) {
            address a = treatmentsProvider[msg.sender][i].patientAddress;
            patientAddresses[i] = a;
        }

        return patientAddresses;
    }

    //get bytes for ipfs hash links back (provider)
    function getAllTreatmentsForProviderIpfs(uint counter) public returns(string){
        return treatmentsProvider[msg.sender][counter].ipfsHash;
    }


}