const Sequelize = require('sequelize');
const UserModel = require('./models/user');
const HardwareModel = require('./models/hardware');
const GroupModel = require('./models/group');
// const TransactionModel = require('./models/transaction');

const sequelize = new Sequelize('nms', 'root', 'root', {
    host: 'localhost',
    dialect: 'mysql',
    pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
})


// const sequelize = new Sequelize('nms', 'root', 'I<3emilia', {
//   host: '10.122.1.220',
//   dialect: 'mysql',
//   pool: {
//   max: 10,
//   min: 0,
//   acquire: 30000,
//   idle: 10000
// }
// })

const User = UserModel(sequelize, Sequelize);
const Group = GroupModel(sequelize, Sequelize);
const Hardware = HardwareModel(sequelize, Sequelize);
// const Transaction = TransactionModel(sequelize, Sequelize);

// Hardware.belongsTo(Group);

sequelize.sync({ alter: true })
  .then(() => {
    console.log(`Database & tables created!`)
  })

module.exports = {
  User,
  Group,
  Hardware
}
