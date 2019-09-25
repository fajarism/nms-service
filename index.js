const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const fileUpload = require('express-fileupload');
const ping = require('ping');
const cors = require('cors')
const Sequelize = require('sequelize')
const Op = Sequelize.Op
const Fn = Sequelize.fn

const saltRounds = 10;
// dependencies
const { User, Group, Hardware} = require('./sequelize');
const session = require('express-session');

const app = express();
app.use(bodyParser.json());
app.use(cors());

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

var container = {};

// API ENDPOINTS USER

// create a user
app.route("/api/user/register")
    // .put(superUserChecker, (req,res, next) => {
        .put((req,res, next) => {
        User.findOne({
            where: {
                nik: req.body.nik
            }
        }).then((ret) =>{
            if(ret === null){
                bcrypt.hash(req.body.password, saltRounds, (err, hash)=>{
                    var input = {
                        nik: req.body.nik,
                        fullname: req.body.fullname,
                        level: req.body.level,
                        password: hash,
			profpic : req.body.profpic
                    }
                    console.log(input);
                    User.create(input)
                    .then(data => res.status(200).send(SuccessResponse(0, data)));
                })
            }else{
                res.status(400).send(ErrorResponse(400, "User Already Exist"))
            }
        })   
    })

// get all users
app.get('/api/user/all', (req, res) => {
    User.findAll().then(users => {
        if(users !== null && users.length != 0){
            res.status(200).send(SuccessResponse(0,users));
        }else{
            res.status(200).send(ErrorResponse(1,users));
        }
    })
})

// search users 
/*
    {@query page : select number of page in which users are listed} 
    {@query count : number of user items to be searched}
    {@query query : name or NIK of user to be searched}

    Query will be searched in field NIK and Fullname
*/
app.get('/api/user/search', (req,res) => {
    let offset = (parseInt(req.query.page) || 0) * (parseInt(req.query.count) || 20)
    let queryLowerString = req.query.query.toLowerCase()
    User.findAndCountAll({
        where : {
            [Op.or] : [
                { nik : Sequelize.where(
                    Sequelize.fn(
                        "lower", Sequelize.col("nik")),
                        "LIKE", "%" + queryLowerString + "%")
                },
                { fullname : Sequelize.where(
                    Sequelize.fn(
                        "lower", Sequelize.col("fullname")),
                        "LIKE", "%" + queryLowerString + "%")
                }
            ]
        },
        offset : offset,
        limit : parseInt(req.query.count || 20)
    }).then(users => {
        if(users !== null && users.count != 0){
            res.status(200).send(SuccessResponse(0,users));
        }else{
            res.status(404).send(ErrorResponse(1,"No data found"));
        }
    })
})

// get one user
app.get('/api/user/:userId', (req, res) => {
    User.findOne({
        where:{
            nik: req.params.userId
        }
    }).then(users => {
        if(users !== null && users.length != 0){
            res.status(200).send(SuccessResponse(0,users));
        }else{
            res.status(200).send(ErrorResponse(1,users));
        }
    })
})

// update user
app.post('/api/user/:id/:nik', (req, res) => {
    User.findOne({
        where:{
            id: req.params.id,
            nik : req.params.nik
        }
    }).then(users => {
        if(users !== null && users.length != 0){
            bcrypt.hash(req.body.password, saltRounds, (err, hash)=>{
                var userData = req.body
                userData.password = hash
                users.update(userData)
                    .then((a) => {
                        res.status(200).send(SuccessResponse(0,"User has been updated"));
                    })
            })
            
        }else{
            res.status(404).send(ErrorResponse(1,"User not found"));
        }
    })
})

// user login
app.post('/api/user/login', (req, res) => {
    User.findOne({
        where: {
            nik: req.body.nik
        }
    })
    .then(req1 => {
        console.log(req.session.cookie.maxAge)
        if(req1 === null) {
            res.status(404).send(ErrorResponse(404, "User not found"));
        } else {
            container = req1;
            console.log(req.body.password, req1.password)
            bcrypt.compare(req.body.password, req1.password)
            .then((isMatch) =>{
                if(isMatch){
                    console.log("Success");
                    console.log(container);
                    container.update({
                        session : req.sessionID
                    })

                    // call proto function to JSON before res.send(function)
                    // to be able to return session, since session cannot be exposed
                    // to any other method except login

                    let returnObj = container.toJSON()
                    returnObj.session = req.sessionID
                    
                    res.status(200).send(SuccessResponse(isMatch, returnObj))
                }else{
                    res.status(401).send(ErrorResponse(isMatch,"Password or NIK do not match"));
                }
            })    
        }
    })
})


// delete user
app.delete('/api/user/delete/:nik', (req, res) => {
    User.destroy({
        where: {
            nik: req.params.nik
        }
    }).then((ret)=>{
        if(ret){
            console.log("Delete Success");
            res.status(200).send(SuccessResponse(0, null));
        }else{
            console.log("Delete Failed");
            res.status(404).send(ErrorResponse(0, "User not exist"));
        }
    })
})

//Group API

// create a group
app.route("/api/group/add")
    // .put(superUserChecker, (req,res, next) => {
    .put((req,res, next) => {
            if(req !== undefined){
                var input = {
                    groupName: req.body.groupName
                }
                console.log(input);
                Group.create(input)
                .then(data => res.status(200).send(SuccessResponse(0, data)));
            }else{
                res.status(400).send(ErrorResponse(1, "Group Already Exist"))
            }   
    })

// get all group
app.route("/api/group/all")
    .get((req, res) => {
        Group.findAll().then(group => {
            if(group !== null && group.length != 0){
                res.status(200).send(SuccessResponse(0,group));
            }else{
                res.status(404).send(ErrorResponse(1,"Group not found"));
            }
        })
    })

app.route("/api/group/:id")
    .delete((req,res) => {
        Group.destroy({
            where : {groupId : req.params.id}
        }).then((ret) => {
            if(ret) {
                res.status(200).send(SuccessResponse(0, "Group has been deleted"))
            } else {
                res.status(404).send(ErrorResponse(0, "Group not found"))
            }
        })
    })

    .post((req,res) => {
        Group.update( req.body, {
            where : {groupId : req.params.id}
        }).then((ret => {
            if(ret[0] > 0) {
                res.status(200).send(SuccessResponse(0, "Group has been updated"))
            } else {
                res.status(404).send(ErrorResponse(0, "Group not found"))
            }
        })) 
    }) 

//Hardware API

// create a hardware
app.route("/api/hardware/add")
    // .put(superUserChecker, (req,res, next) => {
    .put((req,res, next) => {
            if(req !== undefined){
                ping.sys.probe(req.body.hardwareAddr, (isAlive)=>{
                    var input = {
                        hardwareName: req.body.hardwareName,
                        hardwareAddr: req.body.hardwareAddr,
                        groupId: req.body.groupId,
                        status: isAlive
                    }
                    console.log(input);
                    Hardware.create(input)
                	.then(data => {
				var dataJson = data.toJSON()
				var hardwarePicData = {hardwarePic : req.body.picture + dataJson.hardwareId}
			if(req.body.picture) {
                    		Hardware.update(hardwarePicData,{
                        		where : {hardwareId : dataJson.hardwareId}
                    		})
                    		.then( dataUpdate => 
                        	res.status(200).send(SuccessResponse(0, data)));    
                	} else {
               		     res.status(200).send(SuccessResponse(0, data)); 
                	}
			})
                })
            }else{
                res.status(400).send(ErrorResponse(1, "Hardware Already Exist"))
            }
    })

// update hardware info
app.route("/api/hardware/update")
    // .put(superUserChecker, (req,res, next) => {
    .post((req,res, next) => {
        Hardware.findOne({
            where: {
                hardwareId: req.body.hardwareId,
                groupId: req.body.initialGroupId
            }
        }).then((findResponse) =>{
            if(findResponse === null){
                res.status(404).send(ErrorResponse(1, "Hardware not Exist"));
            }
            else{
                ping.sys.probe(req.body.hardwareAddr, (isAlive)=>{
                    var input ={
                        hardwareName: req.body.hardwareName,
                        hardwareAddr: req.body.hardwareAddr,
                        groupId : req.body.groupId,
                        status: isAlive,
			hardwarePic : req.body.hardwarePic
                    }
                    Hardware.update(
                        input,
                    {
                        where: {
                            hardwareId: req.body.hardwareId,
                            groupId: req.body.initialGroupId
                        }
                    }).then((a)=>{
                        res.status(200).send(SuccessResponse(0, null));
                    })
                })
            }
        })   
    })

// get all hardwares
app.route("/api/hardware/all/")
    .get((req, res) => {
        Hardware.findAll().then(hardware => {
            if(hardware !== null && hardware.length != 0){
                res.status(200).send(SuccessResponse(0,hardware));
            }else{
                res.status(404).send(ErrorResponse(1,hardware));
            }
        })
    })

// get all hardwares by group id
app.route("/api/hardware/byGroupId/:groupId")
    .get((req, res) => {
        Hardware.findAll({
            where:{
                groupId: req.params.groupId
            }
        }).then(hardware => {
            if(hardware !== null && hardware.length != 0){
                res.status(200).send(SuccessResponse(0,hardware));
            }else{
                res.status(404).send(ErrorResponse(1,hardware));
            }
        })
    })

// delete hardware
app.delete('/api/hardware/byHardwareId/:hardwareId', (req, res) => {
    Hardware.destroy({
        where: {
            hardwareId: req.params.hardwareId
        }
    }).then((ret)=>{
        if(ret){
            console.log("Delete Success");
            res.status(200).send(SuccessResponse(0, null));
        }else{
            console.log("Delete Failed");
            res.status(404).send(ErrorResponse(0, "Hardware not exist"));
        }
    })
})

// delete hardware by group
app.delete('/api/hardware/byGroupId/:groupId', (req, res) => {
    Hardware.destroy({
        where: {
            groupId: req.params.groupId
        }
    }).then((ret)=>{
        if(ret){
            console.log("Delete Success");
            res.status(200).send(SuccessResponse(0, null));
        }else{
            console.log("Delete Failed");
            res.status(404).send(ErrorResponse(0, "Hardware not exist"));
        }
    })
})

// search hardware
/*
    {@query page : select number of page in which hardware is listed} 
    {@query count : number of hardware items to be searched}
    {@query query : name or address of hardware to be searched}

    Hardware will be searched in address and name field
*/
app.get('/api/hardware/search', (req,res) => {
    let offset = (parseInt(req.query.page) || 0) * (parseInt(req.query.count) || 20)
    let queryLowerString = req.query.query.toLowerCase()
    Hardware.findAndCountAll({
        where : {
            [Op.or] : [
                { hardwareName : Sequelize.where(
                    Sequelize.fn(
                        "lower", Sequelize.col("hardwareName")),
                        "LIKE", "%" + queryLowerString + "%")
                },
                { hardwareAddr : Sequelize.where(
                    Sequelize.fn(
                        "lower", Sequelize.col("hardwareAddr")),
                        "LIKE", "%" + queryLowerString + "%")
                }
            ]
        },
        offset : offset,
        limit : parseInt(req.query.count || 20)
    }).then(users => {
        if(users !== null && users.length != 0){
            res.status(200).send(SuccessResponse(0,users));
        }else{
            res.status(404).send(ErrorResponse(1,"No data found"));
        }
    })
})

//API status checker

// check all hardwares
app.route("/api/status/update/:groupId")
    .get((req, res) => {
        Hardware.findAll({
            where:{
                groupId: req.params.groupId
            }
        }).then( hardware => {
            if(hardware !== null && hardware.length != 0){
                // console.log(hardware);
                var json = [];
                let j = 0;
                for(let i=0; i < hardware.length; i++){
                    ping.sys.probe(hardware[i].hardwareAddr, (isAlive)=>{
                            var msg = isAlive ? 'host ' + hardware[i].hardwareAddr + ' is alive' : 'host ' + hardware[i].hardwareAddr + ' is dead';
                            // console.log(msg, isAlive);
                            var data = {
                                "hardwareId": hardware[i].hardwareId,
                                "status": isAlive
                            }
                            Hardware.update({
                                status: isAlive
                            },{
                                where: {
                                    hardwareId: hardware[i].hardwareId,
                                    groupId: req.params.groupId
                                }
                            });
                            json.push(data);
                            // console.log(json);
                            if(j === hardware.length -1){
                                res.status(200).send(SuccessResponse(0,json));
                            }
                            j++;
                        }
                    );
                }
            }else{
                res.status(200).send(ErrorResponse(1,hardware));
            }
        })
    })


app.get("/api/dashboard", (req,res) => {
    let returnObj = {}
    User.count({
        distinct : true,
       col : 'id'
    }).then(userCount => {
        returnObj.numuser = userCount
        Group.count({
            distinct : true,
            col : 'groupId'
        }).then(groupCount => {
            returnObj.numgroup = groupCount
            Hardware.count({
                distinct : true,
                col : 'hardwareId',
                where : {status : false}
            }).then( hardwareOffCount => {
                returnObj.numhwoff = hardwareOffCount
                Hardware.count({
                    distinct : true,
                    col : 'hardwareId',
                    where : {status : true}
                }).then(hardwareOnCount => {
                    returnObj.numhwon = hardwareOnCount
                    res.status(200).send(SuccessResponse(0, returnObj))
                }) 
            }) 
        })
    })
})

function checkStatus(){
    Group.findAll().then(group => {
        if(group !== null && group.length != 0){
            group.forEach(element => {
                Hardware.findAll({
                    where:{
                        groupId: element.groupId
                    }
                }).then( hardware => {
                    if(hardware !== null && hardware.length != 0){
                        for(let i=0; i < hardware.length; i++){
                            ping.sys.probe(hardware[i].hardwareAddr, (isAlive)=>{
                                    // console.log(element.groupId, hardware[i].hardwareId, "status: "+ isAlive)
                                    Hardware.update({
                                        status: isAlive
                                    },{
                                        where: {
                                            hardwareId: hardware[i].hardwareId,
                                            groupId: element.groupId
                                        }
                                    });
                                }
                            );
                        }
                    }
                }) 
            });
        }
    })
}

let synchronousHardwareTest = async () => {
    let groupIteration = 0
    let iteration = 1
    let groups = await Group.findAll()
    if(groups != null && groups.length != 0) {
        for(const group of groups) {
            let hardwares = await Hardware.findAll({
                where : {groupId : group.groupId}
            })

            for(const hardware of hardwares) {
                let pingResult = await ping.promise.probe(hardware.hardwareAddr)
                console.log(pingResult.alive)
                await Hardware.update({
                        status: pingResult.alive
                    },{
                    where: {
                        hardwareId: hardware.hardwareId,
                        groupId: group.groupId
                    }
                });
    
                console.log("Group " + groupIteration + " dev " + iteration)
                iteration++
            }

            groupIteration++
        }
    }

    synchronousHardwareTest()
}

let tryPromise = () => {
    return new Promise(resolve => {
        resolve(Group.findAll())
    })
}

setTimeout(synchronousHardwareTest, 5000)

const port = 3000;
app.listen(port, () => {
    console.log(`Running on http://localhost:${port}`)
})
