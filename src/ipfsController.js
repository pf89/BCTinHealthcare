//Ipfs instance
var ipfsAPI = require('ipfs-api');
var ipfs = ipfsAPI('/ip4/127.0.0.1/tcp/5001');
const dagPB = require('ipld-dag-pb');

module.exports = {

    //Get the the object out of ipfs hash
    getIpfsData: async function (hash) {
       return await ipfs.get("/ipfs/" + hash);
    },

    postPersonalDataToIPFS: async function (address, personalDataJson) {
        //Prepare json for ipfs upload
        const file = [
            {
                path: '/' + address + '/personalData.json',
                content: Buffer.from(personalDataJson),
            }
        ];
        //const fileBuffer = Buffer.from(personalDataJson);
        var hash = await ipfs.add(file);

        return hash[1].hash;
    },

    postTreatmentToIpfs: async function (address, img, newtreatmentData) {
        // Convert treatment data into buffer
        const file = [];
        var hashArray;
        file.push(
            {
                path: '/' + address + '/treatment/treatment.json',
                content: Buffer.from(newtreatmentData),
            }
        );
        // if img is available, add img buffer to ipfs direcorie
        if (img !== undefined){
            file.push(
                {
                    path: '/' + address + '/treatment/xray.jpg',
                    content: img.data,
                }
            );
            hashArray = await ipfs.files.add(file);
            return hashArray[3].hash;
        }
        hashArray = await ipfs.files.add(file);
        return hashArray[2].hash;
    },


};