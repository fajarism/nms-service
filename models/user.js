module.exports = (sequelize, type) => {
    const User = sequelize.define('tb_user',{
        id: {
            type: type.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        nik: type.STRING,
        fullname: type.STRING,
        level: type.INTEGER,  
        password: type.STRING,
        session: type.STRING,
        profpic: type.STRING,
        setting: type.STRING
    }
    )
    User.prototype.toJSON = function (){
        var values = Object.assign({}, this.get());
        delete values.password;
        delete values.session;
        return values;
    }
    return User;
}
