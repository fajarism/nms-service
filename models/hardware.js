module.exports = (sequelize, type) => {
    const Hardware = sequelize.define('tb_hardware',{
        hardwareId: {
            type: type.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        groupId: type.INTEGER,
        hardwareName: type.STRING,
        hardwareAddr: type.STRING,
        hardwarePic : type.STRING,
	status: type.BOOLEAN
    })
    return Hardware;
}
