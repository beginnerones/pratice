const Sequelize = require('sequelize');

class Apart extends Sequelize.Model{
    static initiate(sequelize){
        Apart.init({
            apart_name:{
                type:Sequelize.STRING(45),
                allowNull:false,
            },
            buildyear:{
                type:Sequelize.INTEGER,
                allowNull:true,
            },
            amount:{
                type:Sequelize.INTEGER,
                allowNull:true,
            },
            location:{
                type:Sequelize.STRING(45),
                allowNull:true,
            },
            area:{
                type:Sequelize.FLOAT,
                allowNull:true,
            },

            
        },{
            sequelize,
            timestamps: false,
            underscored:false,
            modelName:'Apart',
            tableName:'apart_select',
            charset:'utf8',
            collate:'utf8_general_ci',
        });
    }
    static associations(db){}
};

module.exports=Apart;