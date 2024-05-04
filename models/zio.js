const Sequelize = require('sequelize');

class Zio extends Sequelize.Model{
    static initiate(sequelize){
        Zio.init({
            x:{
                type:Sequelize.DOUBLE,
                allowNull:false,
            },
            y:{
                type:Sequelize.DOUBLE,
                allowNull:false,
            },
            location:{
                type:Sequelize.STRING(45),
                allowNull:true,
            },
            
        },{
            sequelize,
            timestamps: false,
            underscored:false,
            modelName:'Zio',
            tableName:'zio',
            charset:'utf8',
            collate:'utf8_general_ci',
        });
    }
    static associations(db){}
};

module.exports=Zio;