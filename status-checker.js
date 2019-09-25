const ping = require('ping');

const {Group, Hardware} = require('./sequelize');

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

setInterval(checkStatus,5000);