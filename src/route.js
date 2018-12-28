//Express
var express = require('express');
var route = express();

//Body-Parser to get values out of form
var bodyParser = require('body-parser');

//fileupload
var fileUpload = require('express-fileupload');

//Fileupload Middleware
route.use(fileUpload());

//Body Parser Middleware
route.use(bodyParser.json());
route.use(bodyParser.urlencoded({extended: true}));

//Set static path
route.use(express.static(__dirname + '/css'));
route.use(express.static(__dirname + '/script'));

//View Engine with ejs
route.set('view engine', 'ejs');
route.set('views', 'views');

//import Controller
var ipfs = require("./ipfsController");
var bct = require("./bctController");
////////////////////////////////////////////////////////////////////////////////////////////
//----Get Requests----/////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
route.get('/', function (req, res) {
    res.render('register');
});

route.get('/main', function (req, res) {
   res.render('main');
});

route.get('/login', function (req, res) {
    res.render('login');
});

route.get('/lastTreatments/:address/:role', async function (req, res) {
    var treatments;
    var treatmentsIpfs;
    if(req.params.role === "Healthcare Provider"){
        treatments = await bct.getTreatmentsforProvider(req.params.address);
        treatmentsIpfs = await bct.getTreatmentsforProviderIpfs(req.params.address, treatments.length);
    }
    else {
        treatments = await bct.getTreatmentsforPatient(req.params.address);
        treatmentsIpfs = await bct.getTreatmentsforPatientIpfs(req.params.address, treatments.length);
    }
    var treatmentArray = [];
    for (var i = 0; i < treatments.length; i++){
        var cout = i + 1;
        var treatmentData = await ipfs.getIpfsData(treatmentsIpfs[i]);
        //Convert Buffer to json object
        var dataString = treatmentData[2].content.toString('utf8');
        var json = JSON.parse(dataString);
        if(treatmentData.length === 4){
            json.img = treatmentData[3].path;
        }
        var treatment = {treatment: "Treatment" + cout, provider: treatments[i], ipfs: json};
        treatmentArray.push(treatment);
    }
    res.render('lastTreatments', { address: req.params.address, role: req.params.role, treatments: treatmentArray});
});


route.get('/treatments/:address/:role', async function (req, res) {
    res.render('treatments', {address: req.params.address, role: req.params.role});
});

route.get('/treatment/:address/:role', function (req, res) {
    res.render('treatment', {address: req.params.address, role: req.params.role});
});

route.get('/profile/:address/:role', async function (req, res) {

    var hash = await bct.getTransactionForPersonalData(req.params.address);
    var personalData = await ipfs.getIpfsData(hash);
    var dataString = personalData[1].content.toString('utf8');
    var json = JSON.parse(dataString);
    res.render('profile', {address: req.params.address, personalData: json, role: req.params.role});
});

route.get('/autorization/:address/:role', async function (req, res) {

    res.render('autorization', {address: req.params.address, role: req.params.role});
});

route.get('/profile/logout', async function (req, res) {

    res.render('register');
});

route.get('/autorization/get/:address/:role', async function (req, res) {
    var pAddresses;
    if(req.params.role === "Patient"){
        pAddresses = await bct.getAutorizaitonPatient(req.params.address);
    }else {
        pAddresses = await bct.getAutorizaitonProvider(req.params.address);
    }
    var personalDateFromAddresses = [];
    for (var i = 0; i < pAddresses.length; i++){
        var personalHash = await bct.getTransactionForPersonalData(pAddresses[i]);
        var personalData = await ipfs.getIpfsData(personalHash);
        var dataString = personalData[1].content.toString('utf8');
        var json = JSON.parse(dataString);
        var user = {address: pAddresses[i], ipfs: json};
        personalDateFromAddresses.push(user);
    }

    res.render('getAutorization',{ address: req.params.address, role: req.params.role, autorization: personalDateFromAddresses});
});
////////////////////////////////////////////////////////////////////////////////////////////
//----Post Requests---/////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
route.post('/user', function (req, res) {
    if(req.body.SelectUser === "hp1"){
        res.render('HealthcareProviderRegistration');
    } else {
        res.render('PatientRegistration');
    }

});

route.post('/login', async function (req, res) {
    //check if account exists on node
    var accountRegistered = await bct.checkIfAccountExists(req.body.Address).catch(err => console.log(err));
    if(accountRegistered) {
        //check if the password is correct
        const unlockUser = await bct.unlockAccount(req.body.Address, req.body.Password).catch(err => console.log(err));
        if(unlockUser){
            //get personal data hash for ipfs
            var hash = await bct.getTransactionForPersonalData(req.body.Address);
            //Get personal data
            var personalData = await ipfs.getIpfsData(hash);
            //Convert Buffer to json object
            var dataString = personalData[1].content.toString('utf8');
            var json = JSON.parse(dataString);
            //return main page
            res.render('main', {address: req.body.Address, role: json["User"]});
        }
        else res.status(500);
    }
    else res.status(500);
});

route.post('/user/add/', async function (req, res) {
    try {
        var user = req.body.User;
        //get password from form
        var password = req.body.Password;
        delete req.body.Password;
        //transfer object to json for ipfs upload
        let personalDataJson = JSON.stringify(req.body);
        //create address for user on blockchain
        const address = await bct.createAddress(password).catch(err => console.log(err));
        //unlock the account on the blockchain
        const unlockUser = await bct.unlockAccount(address, password).catch(err => console.log(err));
        if(unlockUser){
            //data upload to IPFS and get file hash back
            const hash = await ipfs.postPersonalDataToIPFS(address,personalDataJson).catch(err => console.log(err));
            //create transaction on blockchain with IPFS hash and user address
            await bct.addUser(address, hash).catch(err => console.log(err));
        }

        res.render('main', {address: address, role: user});
    } catch (e) {
        console.log(e);
    }
});

route.post('/user/edit/:address/:role', async function (req, res) {
    try {
        //transfer object to json for ipfs upload
        let personalDataJson = JSON.stringify(req.body);
        //data upload to IPFS and get file hash back
        const hash = await ipfs.postPersonalDataToIPFS(req.params.address,personalDataJson).catch(err => console.log(err));

        //create transaction on blockchain with IPFS hash and user address
        await bct.editUser(req.params.address, hash).catch(err => console.log(err));

        res.render('main', {address: req.params.address, role: req.params.role});
    } catch (e) {
        console.log(e);
    }
});

route.post('/treatment/add/:address/:role', async function (req, res) {
    try {
        //transfer object to json for ipfs upload
        const treatmentDataJson = JSON.stringify(req.body);
        //get Xray picture
        var img = req.files.XRay;
        var accountData = await bct.getTransactionForPersonalData(req.body.Patient_Adress);
        var accountDataOnIpfs = await ipfs.getIpfsData(accountData);
        //get Treatment hash
        var hash = await ipfs.postTreatmentToIpfs(req.body.Patient_Adress, img, treatmentDataJson, accountDataOnIpfs).catch(err => console.log(err));

        //is Address autorized
        //const authorized = bct.

        //create transaction on blockchain with IPFS hash and user address
        await bct.addTreatment(req.params.address, req.body.Patient_Adress, hash).catch(err => console.log(err));

        res.render('main', {address: req.params.address, role: req.params.role});
    } catch (e) {
        console.log(e);
    }
});

route.post('/treatment/search/:address/:role', async function (req, res) {
    var treatments;
    var treatmentsIpfs;
    if(req.params.role === "Healthcare Provider"){
        treatments = await bct.getTreatmentsforProvider(req.params.address);
        treatmentsIpfs = await bct.getTreatmentsfromPatient(req.params.address, treatments, req.body.Provider_Adress.toLowerCase());
    }
    else {
        treatments = await bct.getTreatmentsforPatient(req.params.address);
        treatmentsIpfs = await bct.getTreatmentsfromProvider(req.params.address, treatments, req.body.Provider_Adress.toLowerCase());
    }
    var treatmentArray = [];
    for (var i = 0; i < treatmentsIpfs.length; i++){
        var cout = i + 1;
        var treatmentData = await ipfs.getIpfsData(treatmentsIpfs[i]);
        //Convert Buffer to json object
        var dataString = treatmentData[2].content.toString('utf8');
        var json = JSON.parse(dataString);
        if(treatmentData.length === 4){
            json.img = treatmentData[3].path;
        }
        var treatment = {treatment: "Treatment" + cout, provider: req.body.Provider_Adress, ipfs: json};
        treatmentArray.push(treatment);
    }
    res.render('treatmentsFromProvider', { address: req.params.address, role: req.params.role, treatments: treatmentArray});
});

route.post('/autorization/add/:address/:role', async function (req, res) {
    try {

        //store autorization on blockchain
        await bct.addAutorizaiton(req.params.address, req.body.PaAddress).catch(err => console.log(err));

        res.render('main', {address: req.params.address, role: req.params.role});
    } catch (e) {
        console.log(e);
    }
});


////////////////////////////////////////////////////////////////////////////////////////////
//----Initialize server port----///////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
route.listen(3003, function () {
    console.log('Server startet on port 3003...')
});

