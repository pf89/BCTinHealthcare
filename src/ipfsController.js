//Ipfs instance
var ipfsAPI = require('ipfs-api');
//connect to ipfs daemon
var ipfs = ipfsAPI('/ip4/127.0.0.1/tcp/5001');

module.exports = {

    //Get the the object out of ipfs hash
    getIpfsData: async function (hash) {
       return await ipfs.get("/ipfs/" + hash);
    },

    //post data to ipfs
    postPersonalDataToIPFS: async function (address, personalDataJson) {
        //Prepare json for ipfs upload and set the folder name
        const file = [
            {
                path: '/' + address + '/personalData.json',
                content: Buffer.from(personalDataJson),
            }
        ];
        //const fileBuffer = Buffer.from(personalDataJson);
        var hash = await ipfs.add(file);
        //pin hash
        var res = await ipfs.pin.add(hash[0].hash);
        //return path to personal data
        return hash[1].hash;
    },

    //post treatment data from a patient to ipfs
    postTreatmentToIpfs: async function (hpAddress, img, newtreatmentData) {
        //Convert treatment data into buffer thereby notice folder structure
        const file = [];
        var hashArray;
        var myDate = formatDate(new Date());
        file.push(
            {
                path: '/treatments/'+ hpAddress + '/treatment_1_'+ myDate +'/treatment.json',
                content: Buffer.from(newtreatmentData),
            }
        );
        //if img is available, add img buffer to ipfs directory
        if (img !== undefined){
            file.push(
                {
                    path: '/treatments/'+ hpAddress + '/treatment_1_'+ myDate +'/xray.jpg',
                    content: img.data,
                }
            );
            hashArray = await ipfs.files.add(file);
            //pin hash
            var res = await ipfs.pin.add(hashArray[0].hash);
            //return hash array of folder
            return hashArray[3].hash;
        }
        hashArray = await ipfs.files.add(file);
        var res = await ipfs.pin.add(hashArray[0].hash);
        //return hash array of folder
        return hashArray[2].hash;
    },
};

function formatDate(date) {
    var monthNames = [
        "January", "February", "March",
        "April", "May", "June", "July",
        "August", "September", "October",
        "November", "December"
    ];

    var day = date.getDate();
    var monthIndex = date.getMonth();
    var year = date.getFullYear();

    return day + monthNames[monthIndex] + year;
}