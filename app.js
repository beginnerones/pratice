const http=require('http');
const dotenv=require('dotenv');
const url=require('url');
const xml2js=require('xml2js');
const {sequelize}=require('./models');
const Apart=require('./models/apart');
const Zio=require('./models/zio');
const parser=new xml2js.Parser({trim:true,explicitArray:false});



dotenv.config();

const port=process.env.PORT || 8080;

sequelize.sync({force:false})
    .then(()=>{
        console.log('데이터베이스 연결 성공');
    })
    .catch((err)=>{
        console.error(err);
    })

let parseurl='';
const option={
    hostname:'',
    port:80,
    path:'',
    method: '',
};

http.createServer(async(req,res)=>{
    try{
        parseurl=url.parse(req.url,true);
        if(req.method=='GET'){
            option.method= 'GET';
            if(req.url=='/'){
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({message: "아파트 매매값 조회및 주변행사 조회 api에 오신 것을 환영합니다."}));
            }else if(parseurl.pathname=='/api/search'){
                
                const location=parseurl.query.location;
                console.log(location);
                option.hostname='apis.data.go.kr';
                option.path=`/1741000/StanReginCd/getStanReginCdList?serviceKey=${process.env.KEY}&locatadd_nm=${encodeURIComponent(location)}&type=json&PageNo=1&numOfRows=10`;
                const api=http.request(option,(apiRes)=>{
                    ;
                    let data='';
                    apiRes.on('data',(chuck)=>{
                        data+=chuck;
                    });
                    apiRes.on('end',()=>{
                        try{
                            const result=JSON.parse(data);
                            res.writeHead(200, {'Content-Type': 'application/json'});
                            res.end(JSON.stringify(result));
                        }catch(error){
                            res.writeHead(500, {'Content-Type': 'application/json'});
                            res.end(JSON.stringify({message: "데이터 파싱 중 에러가 발생했습니다."}));
                        }
                    });
                });
                api.on('error',(err)=>{
                    console.error(err);
                    res.writeHead(500,{'Content-Type':'application/json'})
                    res.end(JSON.stringify({message: "api호출을 하지 못하였습니다."}));
                })
                api.end();

            }else if(parseurl.pathname=='/api/zio'){
                const type=encodeURIComponent(parseurl.query.type||'PARCEL');
                const address=encodeURIComponent(parseurl.query.address||'서울특별시');
                option.hostname='api.vworld.kr';
                option.path=`/req/address?key=${process.env.ZIO}&service=address&request=GetCoord&format=json&crs=epsg:4326&type=${type}&address=${address}`;

                const api2=http.request(option,(apiRes)=>{
                    let data='';
                    apiRes.on('data',(chuck)=>{
                        data+=chuck;
                    });
                    apiRes.on('end',()=>{
                        try{
                            const result=JSON.parse(data);
                            res.writeHead(200, {'Content-Type': 'application/json'});
                            res.end(JSON.stringify(result));
                        }catch(error){
                            res.writeHead(500, {'Content-Type': 'application/json'});
                            res.end(JSON.stringify({message: "데이터 파싱 중 에러가 발생했습니다."}));
                        }
                    });
                });
                api2.on('error',(err)=>{
                    console.error(err);
                    res.writeHead(500,{'Content-Type':'application/json'})
                    res.end(JSON.stringify({message: "api호출을 하지 못하였습니다."}));
                })
                api2.end();
              
            }else if(parseurl.pathname=='/api/apart'){
                
                const lawn=encodeURIComponent(parseurl.query.lawn||'11110');
                const deal_ymd=encodeURIComponent(parseurl.query.deal_ymd||'201512');
                const simple=encodeURIComponent(parseurl.query.simple||'0');

                option.hostname='openapi.molit.go.kr';
                option.port='8081'
                option.path=`/OpenAPI_ToolInstallPackage/service/rest/RTMSOBJSvc/getRTMSDataSvcAptTrade?serviceKey=${process.env.KEY}&LAWD_CD=${lawn}&DEAL_YMD=${deal_ymd}`;
                
                const api3=http.request(option,(apiRes)=>{
                    let data='';
                    apiRes.on('data',(chuck)=>{
                        data+=chuck;
                       
                    });
                    apiRes.on('end',()=>{ 
                        
                        parser.parseString(data,(err,result)=>{
                            if(err){
                                console.log(err);
                                res.writeHead(500,{'Content-Type':'application/json'})
                                res.end(JSON.stringify({message: "데이터 처리 중 오류가 발생했습니다."}));
                            }else{
                                res.writeHead(200, {'Content-Type': 'application/json'});
                                res.end(JSON.stringify(result));
                            }
                        
                        });
                             
                    });
                    
                });
                api3.on('error',(err)=>{
                    console.error(err);
                    res.writeHead(500,{'Content-Type':'application/json'})
                    res.end(JSON.stringify({message: "외부 API 요청 오류."}));
                })
                api3.end();
            }else if(parseurl.pathname=='/api/event'){
                const os=encodeURIComponent(parseurl.query.os|| "ETC");
                const selindex=parseInt(parseurl.query.selindex,10);
                const radius=encodeURIComponent(parseurl.query.radius||"1000");

                const zioList=await Zio.findOne({
                    attributes:['x','y'],
                    where:{
                        id:selindex,
                    },
                });
                
                if(zioList){
                    console.log(zioList)
                    const x=encodeURIComponent(zioList.dataValues.x);
                    const y=encodeURIComponent(zioList.dataValues.y);
                    option.hostname='apis.data.go.kr';
                    option.path=`/B551011/KorService1/locationBasedList1?serviceKey=${process.env.KEY}&MobileOS=${os}&mapX=${x}&mapY=${y}&radius=${radius}&MobileApp=openapi&_type=json`;
                
                    const api4=http.request(option,(apiRes)=>{
                        let data='';
                        apiRes.on('data',(chuck)=>{
                            data+=chuck;
                        });
                        apiRes.on('end',()=>{
                            try{
                                const result=JSON.parse(data);
                                res.writeHead(200, {'Content-Type': 'application/json'});
                                res.end(JSON.stringify(result));
                            }catch(error){
                                res.writeHead(500, {'Content-Type': 'application/json'});
                                res.end(JSON.stringify({message: "서버에서 데이터를 처리하는 중 문제가 발생했습니다."}));             
                            }
                        });

                    });
                    api4.on('error',(err)=>{
                        console.error(err);
                        res.writeHead(500, {'Content-Type': 'application/json'});
                        res.end(JSON.stringify({message: "외부 API 요청 에러."}));
                    })
                    api4.end();
                }else{
                    res.writeHead(404, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({message: "Zio 에 존재하지 않는 ID."}));
                }
            }else if(parseurl.pathname=='/api/apart/list'){
                try{
                    const apartList=await Apart.findAll({});
                    res.writeHead(200,{'Content-Type': 'application/json'});
                    res.end(JSON.stringify(apartList));
                }catch(error){
                    console.log(error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Internal Server Error' }));
                }
            }

            else if(parseurl.pathname=='/api/zio/list'){
                try{
                    const ZioList=await Zio.findAll({});
                    res.writeHead(200,{'Content-Type': 'application/json'});
                    res.end(JSON.stringify(ZioList));
                }catch(error){
                    console.log(error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Internal Server Error' }));
                }
            }
        }
        else if(req.method==='POST'){
            if(parseurl.pathname=='/api/apart/select'){
                let body='';
                req.on('data',(data)=>{
                    body+=data;
                });
                req.on('end',async()=>{
                    try{
                        console.log(body);
                        const result=JSON.parse(body);
                        if (!result.ApartName || !result.Build || !result.Amount || !result.location || !result.Area) {
                            res.writeHead(400, {'Content-Type': 'application/json'});
                            res.end(JSON.stringify({message: "필드 정보 부족"}));
                            return;
                        }
                        const newApart= await Apart.create({
                            apart_name:result.ApartName,
                            buildyear:result.Build,
                            amount:result.Amount,
                            location:result.location,
                            area:result.Area,
                        });

                        res.writeHead(200,{'Content-Type':'application/json'});
                        res.end(JSON.stringify({message:"저장완료.",newApart}));
                    }catch(err){
                        res.writeHead(500, {'Content-Type': 'application/json'});
                        res.end(JSON.stringify({message: "저장이 되지 않았습니다."}));
                    }
                });
            }else if(parseurl.pathname=='/api/zio/select'){
                let body='';
                req.on('data',(data)=>{
                    body+=data;
                });
                req.on('end',async()=>{
                    try{
                        let type='';
                        body=JSON.parse(body);
                        if(body.type=='지번명'){
                            type=encodeURIComponent('PARCEL');
                        }else if(body.type=='도로명'){
                            type=encodeURIComponent('ROAD');
                        }
                        const address=encodeURIComponent(body.address);
                        option.hostname='api.vworld.kr';
                        option.path=`/req/address?key=${process.env.ZIO}&service=address&request=GetCoord&format=json&crs=epsg:4326&type=${type}&address=${address}`;
                        option.method="GET"

                        const api2=http.request(option,(apiRes)=>{
                            let data='';
                            apiRes.on('data',(chuck)=>{
                                data+=chuck;
                            });
                            apiRes.on('end',async()=>{
                                result=JSON.parse(data);
                                console.log(result);
                                if(result.response.status=='ERROR'){
                                    res.writeHead(404,{'Content-Type':'application/json'})
                                    res.end(JSON.stringify({message:"매개변수 체크"}));
                                    return;
                                }
                                const newZio= await Zio.create({
                                    x:result.response.result.point.x,
                                    y:result.response.result.point.y,
                                    location:result.response.refined.text,
                                });
                               
                                res.writeHead(200, {'Content-Type': 'application/json'});
                                res.end(JSON.stringify({message:"저장 완료"},newZio));
                            });
                        });
                        api2.on('error',(err)=>{
                            console.error(err);
                            res.writeHead(500,{'Content-Type':'application/json'})
                            res.end(JSON.stringify({message: "외부 api호출 요청 실패."}));
                        });
                        api2.end();
                    }catch(e){
                        res.writeHead(400, {'Content-Type': 'application/json'});
                        res.end(JSON.stringify({message: "요청 본문을 파싱하는 중 오류가 발생했습니다."}));
                    }
                        
                });   
            }
        } else if(req.method==='DELETE'){
            const path=parseurl.pathname;
            const trimme=path.replace(/^\/+|\/+$/g, '');
            if(trimme.match(/^api\/zio\/delete\/\d+$/)){
                const id=trimme.split('/')[3];
                try{
                    const deletelist=await Zio.destroy({
                        where:{id:id},
                    });
                    if(!deletelist){
                        res.writeHead(404, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({message:"삭제할 데이터가 존재하지 않습니다."}));
                    } 
                    res.writeHead(202, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({message:"삭제 성공", deletelist}));
                }catch(e){
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(JSON.stringify({ message: "서버 오류" })));
                }
            }
            else if(trimme.match(/^api\/apart\/delete\/\d+$/)){
                const id=trimme.split('/')[3];
                try{
                    const deleteApart=await Apart.destroy({
                        where:{id:id},
                    });
                    if(!deleteApart) {
                        res.writeHead(404, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({message:"삭제할 데이터가 존재하지 않습니다."}));
                    } else {
                        res.writeHead(202, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({message:"삭제 성공", deleteApart}));
                    }
                }catch(e){
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(JSON.stringify({ message: "서버 오류" })));
                }
            }
        }
        else{
            res.writeHead(404,{'Content-Type':'application/json'});
            res.end(JSON.stringify({message:"라우터가 없습니다."}));
        }
    } catch(err){
        res.writeHead(500,{'Content-Type':'application/json'})
        res.end(err.message);
    }

}).listen(port,()=>{
    console.log(`${port}번 포트에서 대기중.`);
});