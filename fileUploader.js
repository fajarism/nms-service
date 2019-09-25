const express = require('express');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const cors = require('cors')
//const Sequelize = require('sequelize')
//const Op = Sequelize.Op
//const Fn = Sequelize.fn

// dependencies
//const { User, Group, Hardware} = require('./sequelize');
const session = require('express-session');

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(fileUpload());

app.use(session({
    secret : "b1001telematik",
    resave : false,
    saveUninitialized : true,
    cookie : {
        maxAge : 1000* 60 * 60 *24 * 365 
    }
}))

function SuccessResponse( responsecode, data){
	return({
			"status" : "success",
			"code" : responsecode,
            "data" : data,
            "message" : null
	})
}

function ErrorResponse ( responsecode, msg){
	return({
			"status": "error",
            "code" : responsecode,
            "data" : null,
			"message" : msg
	})
}
/*
function superUserChecker(req,res, next) {
    if(req.body.session !== req.sessionID) {
        res.status(440).send(ErrorResponse(440, "Session not authentic, please login again"))
    }

    else if(req.session.cookie.maxAge <= 0) {
        res.status(440).send(ErrorResponse(440, "Session expired, please login again"))
    }

    else {
        User.findOne({
            where : {
                session : req.body.session
            }
        }).then((ret) => {
            if(ret == null) {
                res.status(440).send(ErrorResponse(440, "Session not found, please login again"))
            }
    
            if(ret.level !== 99) {
                res.status(403).send(ErrorResponse(403, "Not an admin, operation is cancelled"))
            }
    
            else {
                next()
            }
        })
    }
}
*/
//Image related API

app.post('/api/upload/image/profpic', (req, res) => {
    if (Object.keys(req.files).length == 0) {
        return res.status(400).send(ErrorResponse(400, "No files were uploaded"));
    }
    let image = req.files.image;
    let fileName = req.body.fileName;

    image.mv(`imagedb/profpic/${fileName}`, function(err){
        if(err)
            return res.status(500).send(ErrorResponse(500, err));
        res.status(200).send(SuccessResponse(0, "File successfully uploaded"))
    });
});

app.post('/api/upload/image/device', (req, res) => {
    if (Object.keys(req.files).length == 0) {
        return res.status(400).send(ErrorResponse(400, "No files were uploaded"));
    }
    let image = req.files.image;
    let fileName = req.body.fileName;

    image.mv(`imagedb/device/${fileName}`, function(err){
        if(err)
            return res.status(500).send(ErrorResponse(500, err));
        res.status(200).send(SuccessResponse(0, "File successfully uploaded"))
    });
});

const port = 4000;
app.listen(port, () => {
    console.log(`Running on http://localhost:${port}`)
})
