pragma solidity ^0.4.24;

contract Register {

    //create a mapping to match an account to the ipfs data storage
    mapping(address => string) private users;

    //at the registration, any user gets an address with their ipfs hash. Store this transaction on the blockchain
    function addUserAddress (string memory _ipfsHashAccountdata) public {
        //Check if the address is not existing in mapping
        require(bytes(users[msg.sender]).length == 0);
        //Add ipfs hash value to account
        users[msg.sender] = _ipfsHashAccountdata;
    }

    //at the registration, any user gets an address with their ipfs hash. Store this transaction on the blockchain
    function editUser(string memory _ipfsHashAccountdata) public {
        //Add ipfs hash value to account
        users[msg.sender] = _ipfsHashAccountdata;
    }

    //get ipfs hash matched to account
    function getPersonalIPFSHash() public view returns(string memory){
        return users[msg.sender];
    }

    //get ipfs hash matched to specific address
    function getPersonalIPFSHashForProvider(address patientAddress) public view returns(string memory){
        return users[patientAddress];
    }
}