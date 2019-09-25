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