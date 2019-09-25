module.exports = (sequelize, type) => {
    const Group = sequelize.define('tb_group',{
        groupId: {
            type: type.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        groupName: type.STRING,
        reserve1: type.STRING,
        reserve2: type.STRING,
    })
    return Group;
}
