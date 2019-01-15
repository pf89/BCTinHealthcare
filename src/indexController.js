//Express
var express = require('express');
var indexController = express();
//Body-Parser to get values out of form
var bodyParser = require('body-parser');
//fileupload
var fileUpload = require('express-fileupload');
//Fileupload Middleware
indexController.use(fileUpload());
//Body Parser Middleware
indexController.use(bodyParser.json());
indexController.use(bodyParser.urlencoded({extended: true}));
//Set static path
indexController.use(express.static(__dirname + '/css'));
indexController.use(express.static(__dirname + '/script'));
//View Engine with ejs
indexController.set('view engine', 'ejs');
indexController.set('views', 'views');
//import Controller
var ipfs = require("./ipfsController");
var bct = require("./bctController");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//----Get Requests----/////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//Render registerpage on which you can choose between the roles patient or healthcare provider as a first step of
// registering
indexController.get('/', function (req, res) {
    res.render('register');
});

//render startpage
indexController.get('/main/:address/:role', async function (req, res) {
    //get the last two authorizations and treatments for user
    var lastTwoEntriesAuto = await getMainPageAuthorization(req.params.role, req.params.address);
    var lastTwoEntriesTreat = await getMainPageTreatment(req.params.role, req.params.address);
    //return main page
    res.render('main', {address: req.params.address, role: req.params.role, authorizations: lastTwoEntriesAuto,
        treatments: lastTwoEntriesTreat});
});

//render login page
indexController.get('/login', function (req, res) {
    res.render('login');
});

//render add treatment apge
indexController.get('/addtreatment/:address/:role', function (req, res) {
    res.render('addtreatment', {address: req.params.address, role: req.params.role});
});

//render search treatments page
indexController.get('/searchtreatment/:address/:role', async function (req, res) {
    res.render('searchtreatment', {address: req.params.address, role: req.params.role});
});

//render  add authorization page
indexController.get('/addauthorization/:address/:role', async function (req, res) {
    res.render('addauthorization', {address: req.params.address, role: req.params.role});
});

//render search authorization page
indexController.get('/searchauthorization/:address/:role', async function (req, res) {
    res.render('searchauthorization', {address: req.params.address, role: req.params.role});
});

//render profile page
indexController.get('/profile/:address/:role', async function (req, res) {
    //get personal data of user to show it on the UI
    var hash = await bct.getTransactionForPersonalData(req.params.address);
    var personalData = await ipfs.getIpfsData(hash);
    //convert buffer into json
    var dataString = personalData[1].content.toString('utf8');
    var json = JSON.parse(dataString);
    res.render('profile', {address: req.params.address, personalData: json, role: req.params.role});
});

//render register page again after logout
indexController.get('/logout', async function (req, res) {
    res.render('register');
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//----Post Requests---/////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//After the role is selected, return the page for entering personal data
indexController.post('/user', function (req, res) {
    //if patient or healthcare provider
    if(req.body.SelectUser === "hp1"){
        res.render('healthcareproviderregistration');
    } else {
        res.render('patientregistration');
    }
});

indexController.post('/user/add/', async function (req, res) {
    try {
        //patient or healthcare provider
        var user = req.body.User;
        //get password from form
        var password = req.body.Password;
        //delete password from body so that it is not uploaded to ipfs
        delete req.body.Password;
        //transfer object to json for ipfs upload
        let personalDataJson = JSON.stringify(req.body);
        //create address for user on blockchain
        const address = await bct.createAddress(password).catch(err => console.log(err));
        //unlock the account on the blockchain
        const unlockUser = await bct.unlockAccount(address, password).catch(err => console.log(err));
        if(unlockUser){
            //data upload to IPFS and get file hash back
            const hash = await ipfs.postPersonalDataToIPFS(address,personalDataJson)
                .catch(err => console.log(err));
            //create transaction on blockchain with IPFS hash and user address
            await bct.addUser(address, hash).catch(err => console.log(err));
        }
        //return start page. So far no authorizations and treatments have been made therefore undefined
        res.render('main', {address: address, role: user, authorizations: "undefined", treatments: "undefined"});
    } catch (e) {
        console.log(e);
    }
});

indexController.post('/login', async function (req, res) {
    //check if account exists on node
    var accountRegistered = await bct.checkIfAccountExists(req.body.Address).catch(err => console.log(err));
    if(accountRegistered) {
        //check if the password is correct and unlock the user for conducting transactions
        const unlockUser = await bct.unlockAccount(req.body.Address, req.body.Password)
            .catch(err => console.log(err));
        if(unlockUser){
            //get personal data hash for ipfs
            var hash = await bct.getTransactionForPersonalData(req.body.Address);
            //Get personal data for user
            var personalData = await ipfs.getIpfsData(hash);
            //Convert Buffer to json object
            var dataString = personalData[1].content.toString('utf8');
            var json = JSON.parse(dataString);
            //get the last authorizations for startpage for user
            var lastTwoEntriesAuto = await getMainPageAuthorization(json["User"], req.body.Address);
            //get the last treatments for startpage for user
            var lastTwoEntriesTreat = await getMainPageTreatment(json["User"], req.body.Address);
            //return main page
            res.render('main', {address: req.body.Address, role: json["User"], authorizations: lastTwoEntriesAuto,
                treatments: lastTwoEntriesTreat});
        }
        else res.status(500);
    }
    else res.status(500);
});

//add Treatment for patient from provider
indexController.post('/treatment/add/:address/:role', async function (req, res) {
    try {
       var isAuthorized = await bct.isAuthorized(req.body.Patient_Address, req.params.address);
       if(isAuthorized) {
           //get personal data for adding patient name to treatment
           var accountDataPatient = await bct.getTransactionForPersonalData(req.body.Patient_Address);
           var accountDataOnIpfsPatient = await ipfs.getIpfsData(accountDataPatient);
           var dataStringPatient = accountDataOnIpfsPatient[1].content.toString('utf8');
           var jsonPatient = JSON.parse(dataStringPatient);
           req.body.PatientName = jsonPatient["Name"];
           //get personal data for adding healthcare provider name to treatment
           var accountDataProvider = await bct.getTransactionForPersonalData(req.params.address);
           var accountDataOnIpfsProvider = await ipfs.getIpfsData(accountDataProvider);
           var dataStringProvider = accountDataOnIpfsProvider[1].content.toString('utf8');
           var jsonProvider = JSON.parse(dataStringProvider);
           req.body.HealthcareProviderName = jsonProvider["Name"];
           //add date and time to treatment
           req.body.Date = new Date();
           //transfer object to json for ipfs upload
           const treatmentDataJson = JSON.stringify(req.body);
           //get Xray picture from form
           var img = req.files.XRay;
           //add treatment to ipfs and get treatment hash back
           var hash = await ipfs.postTreatmentToIpfs(req.body.Patient_Address, img, treatmentDataJson)
               .catch(err => console.log(err));
           //create transaction on blockchain with IPFS hash and user address
           await bct.addTreatment(req.params.address, req.body.Patient_Address, hash)
               .catch(err => console.log(err));
           //get the last authorizations for startpage for user
           var lastTwoEntriesAuto = await getMainPageAuthorization(req.params.role, req.params.address);
           //get the last treatments for startpage for user
           var lastTwoEntriesTreat = await getMainPageTreatment(req.params.role, req.params.address);
           //return startpage
           res.render('main', {
               address: req.params.address, role: req.params.role, authorizations: lastTwoEntriesAuto,
               treatments: lastTwoEntriesTreat
           });
       } else{
           console.log("not authorized");
       }
    } catch (e) {
        console.log(e);
    }
});

//search treatment for specific address or search all treatments
indexController.post('/treatment/search/:address/:role', async function (req, res) {
    var isAuthorized = await bct.isAuthorized(req.body.Patient_Address, req.params.address);
    if(isAuthorized || req.params.role === "Patient") {
        var treatments;
        var treatmentsIpfs;
        if (req.params.role === "Healthcare Provider") {
            //get list of addreses to which a healthcare provider was providing treatments
            treatments = await bct.getTreatmentsforProvider(req.params.address);
            //get treatment ipfs hashes to specific patient address
            treatmentsIpfs = await bct.getTreatmentsfromPatient(req.params.address, treatments,
                req.body.Patient_Address);
        } else {
            //get list of addresses of healhcare providers a user got treatments
            treatments = await bct.getTreatmentsforPatient(req.params.address);
            //get treatment ipfs hashes to specific healthcare provider address
            treatmentsIpfs = await bct.getTreatmentsfromProvider(req.params.address, treatments,
                req.body.Provider_Address);
        }
        var treatmentArray = [];
        //loop through hashes to get treatment data from ipfs
        for (var i = 0; i < treatmentsIpfs.length; i++) {
            var cout = i + 1;
            var treatmentData = await ipfs.getIpfsData(treatmentsIpfs[i]);
            //Convert Buffer to json object
            var dataString = treatmentData[2].content.toString('utf8');
            var json = JSON.parse(dataString);
            //Because the data is stored in a specific structure the values are accessed via indexes
            if (treatmentData.length === 4) {
                json.img = treatmentData[3].path;
            }
            var treatment = {treatment: "Treatment" + cout, provider: req.body.Provider_Address, ipfs: json};
            treatmentArray.push(treatment);
        }
        //return treatments result
        res.render('searchtreatmentsresult', {
            address: req.params.address, role: req.params.role,
            treatments: treatmentArray
        });
    }
    else console.log("not authorized");
});

//Search all treatments made by a healthcare provider for a specific patient address or search all
// treatments received by a patient
indexController.post('/treatment/searchall/:address/:role', async function (req, res) {
    var isAuthorized = await bct.isAuthorized(req.body.Patient_Address, req.params.address);
    if(isAuthorized || req.params.role ==="Patient") {
        var treatments;
        var treatmentsIpfs;
        if (req.params.role === "Healthcare Provider") {
            //get list of addresses of healhcare providers a user got treatments
            treatments = await bct.getTreatmentsforPatient(req.body.Patient_Address);
            //get treatment ipfs hash for the list of addresses
            treatmentsIpfs = await bct.getTreatmentsforPatientIpfs(req.body.Patient_Address, treatments.length);
        } else {
            treatments = await bct.getTreatmentsforPatient(req.params.address);
            treatmentsIpfs = await bct.getTreatmentsforPatientIpfs(req.params.address, treatments.length);
        }
        var treatmentArray = [];
        //loop through ipfs hashes and get treatment data from ipfs
        for (var i = 0; i < treatments.length; i++) {
            var cout = i + 1;
            var treatmentData = await ipfs.getIpfsData(treatmentsIpfs[i]);
            //Convert Buffer to json object
            var dataString = treatmentData[2].content.toString('utf8');
            var json = JSON.parse(dataString);
            //Because the data is stored in a specific structure the values are accessed via indexes
            if (treatmentData.length === 4) {
                json.img = treatmentData[3].path;
            }
            var treatment = {treatment: "Treatment" + cout, provider: treatments[i], ipfs: json};
            treatmentArray.push(treatment);
        }
        //return found treatments
        res.render('searchtreatmentresultall', {
            address: req.params.address, role: req.params.role,
            treatments: treatmentArray
        });
    }
    else console.log("not authorized");
});

//Add authorization
indexController.post('/authorization/add/:address/:role', async function (req, res) {
    try {
        //check if patient password is correct because patient needs to accept authorization
        var patientPasswordTrue = await bct.unlockAccount(req.body.PaAddress, req.body.PaPassword);
        if(patientPasswordTrue) {
            //store authorization on blockchain
            await bct.addAuthorizaiton(req.params.address, req.body.PaAddress).catch(err => console.log(err));
            //get the last authorizations for startpage for user
            var lastTwoEntriesAuto = await getMainPageAuthorization(req.params.role, req.params.address);
            //get the last treatments for startpage for user
            var lastTwoEntriesTreat = await getMainPageTreatment(req.params.role, req.params.address);
            //return startpage
            res.render('main', {address: req.params.address, role: req.params.role, authorizations: lastTwoEntriesAuto,
                treatments: lastTwoEntriesTreat});
        }
    } catch (e) {
        console.log(e);
    }
});

//search available authorizations for healthcare provider or patient
indexController.post('/authorization/search/:address/:role', async function (req, res) {
    try {
        var pAddresses;
        //get list of healthcare provider addresses or patient addresses
        if(req.params.role === "Patient"){
            pAddresses = await bct.getAuthorizaitonPatient(req.params.address);
        }else {
            pAddresses = await bct.getAuthorizaitonProvider(req.params.address);
        }
        var user;
        //loop through these addresses and call ipfs method to get personal data of these addresses
        for (var i = 0; i < pAddresses.length; i++) {
            if (req.body.Provider_Address.toLowerCase() === pAddresses[i]) {
                var personalHash = await bct.getTransactionForPersonalData(pAddresses[i]);
                var personalData = await ipfs.getIpfsData(personalHash);
                //Convert buffer into json
                var dataString = personalData[1].content.toString('utf8');
                var json = JSON.parse(dataString);
                //add user address and personal data to a list
                user = {address: pAddresses[i], ipfs: json};
            }
        }
        //if no authorization exists
        if(user === undefined){
            user.ipfs = 0;
        }
        res.render('searchauthorizationresult',{ address: req.params.address, role: req.params.role,
            authorization: user});
    }
    catch (e) {
        console.log(e);
    }

});

//search all authorizations for healthcare proveder or patient
indexController.post('/authorization/searchall/:address/:role', async function (req, res) {
    var pAddresses;
    //return ether a list of all healthcare provider addresses or patient addresses
    if(req.params.role === "Patient"){
        pAddresses = await bct.getAuthorizaitonPatient(req.params.address);
    }else {
        pAddresses = await bct.getAuthorizaitonProvider(req.params.address);
    }
    var personalDateFromAddresses = [];
    //loop through addresses to get personal data
    for (var i = 0; i < pAddresses.length; i++){
        var personalHash = await bct.getTransactionForPersonalData(pAddresses[i]);
        var personalData = await ipfs.getIpfsData(personalHash);
        //convert buffer into json
        var dataString = personalData[1].content.toString('utf8');
        var json = JSON.parse(dataString);
        var user = {address: pAddresses[i], ipfs: json};
        personalDateFromAddresses.push(user);
    }
    res.render('searchauthorizationresultall',{ address: req.params.address, role: req.params.role,
        authorization: personalDateFromAddresses});
});

//Edit user profile
indexController.post('/user/edit/:address/:role', async function (req, res) {
    try {
        //transfer object to json for ipfs upload
        let personalDataJson = JSON.stringify(req.body);
        //data upload to IPFS and get file hash back
        const hash = await ipfs.postPersonalDataToIPFS(req.params.address,personalDataJson).catch(err => console.log(err));
        //create transaction on blockchain with IPFS hash and user address
        await bct.editUser(req.params.address, hash).catch(err => console.log(err));
        //get the last authorizations for startpage for user
        var lastTwoEntriesAuto = await getMainPageAuthorization(req.params.role, req.params.address);
        //get the last treatments for startpage for user
        var lastTwoEntriesTreat = await getMainPageTreatment(req.params.role, req.params.address);
        res.render('main', {address: req.params.address, role: req.params.role, authorizations: lastTwoEntriesAuto,
            treatments: lastTwoEntriesTreat});
    } catch (e) {
        console.log(e);
    }
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//----General JS Functions---//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//return the last two authorizations for user
async function getMainPageAuthorization(role, address){
    //get all authorizations for user to show it on startpage
    var personalDataAuthohorization = await getAuthorization(role, address);
    var lastTwoEntriesAuto;
    //if the authorization list is larger then 2, get the last two entries from the list
    if(personalDataAuthohorization.length>=2) {
        lastTwoEntriesAuto = personalDataAuthohorization.slice(personalDataAuthohorization.length - 2,
            personalDataAuthohorization.length);
    }
    else if(personalDataAuthohorization.length === 0){
        lastTwoEntriesAuto = "undefined";
    }
    else {
        lastTwoEntriesAuto = personalDataAuthohorization;
    }
    return lastTwoEntriesAuto;
}

async function getAuthorization(role, address){
    var pAddresses;
    if(role === "Patient"){
        pAddresses = await bct.getAuthorizaitonPatient(address);
    }else {
        pAddresses = await bct.getAuthorizaitonProvider(address);
    }
    var personalDateFromAddresses = [];
    for (var i = 0; i < pAddresses.length; i++){
        //for each address return ipfs hash for personal data
        var personalHash = await bct.getTransactionForPersonalData(pAddresses[i]);
        //get the personal data of the user
        var personalData = await ipfs.getIpfsData(personalHash);
        //convert buffer to json
        var dataString = personalData[1].content.toString('utf8');
        var json = JSON.parse(dataString);
        var user = {address: pAddresses[i], ipfs: json};
        //add user address and personal data to a list
        personalDateFromAddresses.push(user);
    }
    return personalDateFromAddresses;
}

//return last two treatments for user
async function getMainPageTreatment(role, address){
    //get last treatments for user to show it on startpage
    var treatmentData = await getTreatment(role, address);
    var lastTwoEntriesTreat;
    //if the treatment list is larger then 2, get the last two entries from the list
    if(treatmentData.length >= 2) {
        lastTwoEntriesTreat = treatmentData.slice(treatmentData.length - 2, treatmentData.length);
    }
    else if(treatmentData.length === 0){
        lastTwoEntriesTreat = "undefined";
    }
    else {
        lastTwoEntriesTreat = treatmentData;
    }
    return lastTwoEntriesTreat;
}

async function getTreatment(role, address){
    var treatments;
    var treatmentsIpfs;
    if(role === "Healthcare Provider"){
        //return all treatments performed by the healthcare provider
        treatments = await bct.getTreatmentsforProvider(address);
        //get treatment ipfs hash for the list of addresses
        treatmentsIpfs = await bct.getTreatmentsforProviderIpfs(address, treatments.length);
    }
    else {
        treatments = await bct.getTreatmentsforPatient(address);
        treatmentsIpfs = await bct.getTreatmentsforPatientIpfs(address, treatments.length);
    }
    var treatmentArray = [];
    //loop through all treatments
    for (var i = 0; i < treatments.length; i++){
        var cout = i + 1;
        //get treatment data from ipfs
        var treatmentData = await ipfs.getIpfsData(treatmentsIpfs[i]);
        //Convert Buffer to json object
        var dataString = treatmentData[2].content.toString('utf8');
        var json = JSON.parse(dataString);
        //Because the data is stored in a specific structure the values are accessed via indexes
        if(treatmentData.length === 4){
            json.img = treatmentData[3].path;
        }
        //return an array of treatment data
        var treatment = {treatment: "Treatment" + cout, provider: treatments[i], ipfs: json};
        treatmentArray.push(treatment);
    }
    return treatmentArray
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//----Initialize server port----///////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//server for running application
indexController.listen(3003, function () {
    console.log('Server startet on port 3003...')
});

