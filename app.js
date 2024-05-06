const http=require('http');  //기본적으로 통신할 HTTP모듈입니다
const dotenv=require('dotenv'); //env파일을 일기 위한 모듈입니다.
const url=require('url'); //url부분을 구별하기 위해 사용하는 모듈입니다.
const xml2js=require('xml2js'); //xnl파일을 json으로 바꾸기위해 사용하는 모듈입니다.
const {sequelize}=require('./models'); //데이터베이스를 연결하기 위해 사용하는 라이브러리 입니다.
const Apart=require('./models/apart'); //아파트 데이터베이스와 연결된 아파트 모듈입니다.
const Zio=require('./models/zio'); //zio 데이터베이스와 연결된 zio 모듈입니다.
const parser=new xml2js.Parser({trim:true,explicitArray:false}); //json으로 변경시 띄어쓰기를 없애고 필요없는 대괄호를 없애는 것을 설정한것입니다.



dotenv.config(); //env파일 읽기 위해서 설정합니다.

const port=process.env.PORT || 8080;  //기본적인 포트번호로서 사용하기 위해 작성하였습니다.

sequelize.sync({force:false}) //시퀄라이즈를 실행하여 데이터베이스를 연결합니다.
    .then(()=>{
        console.log('데이터베이스 연결 성공');
    })
    .catch((err)=>{
        console.error(err);
    })

let parseurl=''; //요청에 요청을 받아서 각각 경로를 구별해주기 위해서 사용하여 줍니다.이것을 안쓸시 쿼리스트링을 사용하기 힘듭니다.
const option={ //api에 url부분을 담습니다.
    hostname:'', //기본적인 주소를 작성합니다
    port:80,
    path:'', //주소 뒤에 경로부분과 매개변수를 작성하는 부분입니다.
    method: '', //get방식인지 post방식인지를 선택합니다.
};

http.createServer(async(req,res)=>{  //서버를 생성합니다.
    try{
        parseurl=url.parse(req.url,true);//이곳에서 요청 url부분을 담습니다.이제 자유롭게 퀴리스트링이 가능해 집니다.
        if(req.method=='GET'){  //만약 get방식으로 클라이언트가 호출할시
            option.method= 'GET';
            if(req.url=='/'){// 기본경로입니다.그냥 처음 경로를 입력하지않고 들어올시 수행됩니다.
                res.writeHead(200, {'Content-Type': 'application/json'}); //헤더 부분에 정상호출되었다는 200코드와 반환타입을 작성합니다.
                res.end(JSON.stringify({message: "아파트 매매값 조회및 주변행사 조회 api에 오신 것을 환영합니다."}));
            }else if(parseurl.pathname=='/api/search'){ //법정동 코드를 조회하는 부분입니다.
                
                const location=parseurl.query.location; //쿼리스트링을 작성된 부분중 주소에 대한 부분입니다.(ex.서울특별시,광주,송도 등)
                console.log(location);
                option.hostname='apis.data.go.kr';  //api에 기본 주소를 작성하여 줍니다.
                option.path=`/1741000/StanReginCd/getStanReginCdList?serviceKey=${process.env.KEY}&locatadd_nm=${encodeURIComponent(location)}&type=json&PageNo=1&numOfRows=10`;
                //api에 경로와 서비스키,주소,리턴타입등의 정보를 작성해줍니다.
                const api=http.request(option,(apiRes)=>{ //해당 api주소로 외부api에 http요청을 보냅니다.
        
                    let data=''; 
                    apiRes.on('data',(chuck)=>{ //api주소로 요청한 데이터 조각들을 하나의 데이터로 모읍니다.
                        data+=chuck;
                    });
                    apiRes.on('end',()=>{ //더이상 올데이터가 없을시 실행됩니다.
                        try{
                            const result=JSON.parse(data); //데이터를 js객체로 변환하여 줍니다.
                            res.writeHead(200, {'Content-Type': 'application/json'});   // 클라이언트에게 성공적으로 데이터를 받았다는 HTTP 상태 코드 200을 설정합니다.
                            res.end(JSON.stringify(result)); //해당 데이터를 다시 json으로 변환하여 클라이언트에게 반환합니다.
                        }catch(error){//만약 데이터 변환중 에러가 나올시 이곳이 실행되며 500코드를 클라이언트에게 보냅니다.
                            res.writeHead(500, {'Content-Type': 'application/json'});
                            res.end(JSON.stringify({message: "데이터 파싱 중 에러가 발생했습니다."}));
                        }
                    });
                });
                api.on('error',(err)=>{ //http요청중 발생하는 모든 에러들을 처리하는 부분입니다
                    console.error(err); //콘솔에 에러 메세지를 출력
                    res.writeHead(500,{'Content-Type':'application/json'})//클라이언트에게 500코드와 함께 json으로 메시지를 전송합니다.
                    res.end(JSON.stringify({message: "api호출을 하지 못하였습니다."}));
                })
                api.end();

            }else if(parseurl.pathname=='/api/zio'){ //작성한 장소,주소에 x,y좌표를 조회 해주는 라우터 부분입니다.
                let type=req.query.type; // 도로명주소로 작성할지 지번주소로 작성할지 선택합니다.
                if(type=='지번명'){ //지번명으로 입력시
                    type=encodeURIComponent('PARCEL');
                }else if(type =='도로명'){ //도로명으로 입력시
                    type=encodeURIComponent('ROAD');
                }else{ //기본값
                type=encodeURIComponent('PARCEL');
                }
                const address=encodeURIComponent(parseurl.query.address); //조회할 주소를 작성하여 줍니다.(ex.김해,김포,포천 등)
                option.hostname='api.vworld.kr'; //api url부분입니다.
                option.path=`/req/address?key=${process.env.ZIO}&service=address&request=GetCoord&format=json&crs=epsg:4326&type=${type}&address=${address}`;
                //경로와 매개변수로 서비스키,주소,도로,지번명등을 작성해줍니다.
                const api2=http.request(option,(apiRes)=>{  //해당 api url주소로 http요청을 보내주는 부분입니다.
                    let data='';
                    apiRes.on('data',(chuck)=>{
                        data+=chuck;  //api호출 결과로 오는 데이터조각을 하나의 데이터로 받아줍니다.
                    });
                    apiRes.on('end',()=>{
                        try{
                            const result=JSON.parse(data); //js객체로 변환하여 정렬하여 줍니다. 
                            res.writeHead(200, {'Content-Type': 'application/json'});//변환이 정상적으로 되었으므로 200코드와 메시지를 전송해 줍니다.
                            res.end(JSON.stringify(result));
                        }catch(error){ //만약 json변환과 전송중 문제 발생시 호출되는 부분입니다.
                            res.writeHead(500, {'Content-Type': 'application/json'}); //500코드와 메시지를 보냅니다.
                            res.end(JSON.stringify({message: "데이터 파싱 중 에러가 발생했습니다."}));
                        }
                    });
                });
                api2.on('error',(err)=>{ //http에서 전체적으로 발생하는 오류를 잡아주는 부분입니다.
                    console.error(err); //콘솔로 해당 오류를 확인할수 있게 합니다.
                    res.writeHead(500,{'Content-Type':'application/json'}) //500오류코드와 메세지를 전송해줍니다.
                    res.end(JSON.stringify({message: "api호출을 하지 못하였습니다."}));
                })
                api2.end();
              //아파트에 대한 정보로 법정동코드,계약년도월을 작성해 매매 정보를 조회하여 줍니다.
            }else if(parseurl.pathname=='/api/apart'){
                
                const lawn=encodeURIComponent(parseurl.query.lawn); //법정동코드를 입력하는 부분입니다.(11110),위에 api로 조회를 하면 됩니다.
                const deal_ymd=encodeURIComponent(parseurl.query.deal_ymd); //그 해당 건물에 계약년도와 월을 입력합니다. (202103,201103)
                const simple=encodeURIComponent(parseurl.query.simple||'0'); //해당 정보를 간단하게 볼지 아닌지를 입력합니다.(1,0)

                option.hostname='openapi.molit.go.kr'; //api 주소를 작성합니다.
                option.port='8081' //api 주소에 작성되어있던 포트번호로 변경해줍니다.
                option.path=`/OpenAPI_ToolInstallPackage/service/rest/RTMSOBJSvc/getRTMSDataSvcAptTrade?serviceKey=${process.env.KEY}&LAWD_CD=${lawn}&DEAL_YMD=${deal_ymd}`;
                //경로와 매개변수를 합쳐 작성하여 줍니다.
                const api3=http.request(option,(apiRes)=>{  //해당 api url주소로 http요청을 보내주는 부분입니다.
                    let data='';  
                    apiRes.on('data',(chuck)=>{
                        data+=chuck;  //api 호출에 대한 결과로 데이터조각들을 위에 data변수에 담아 하나로 만들어 줍니다.
                       
                    });
                    apiRes.on('end',()=>{ 
                        parser.parseString(data,(err,result)=>{ //이 데이터는 무조건 xml데이터로 오기 때문에 데이터를 넣고 json으로 변환하는 부분입니다.
                            if(err){ //만약 변환중 오류가 발생한다면 수행합니다.
                                console.log(err);
                                res.writeHead(500,{'Content-Type':'application/json'}) //클라이언트에게 500코드와 오류메세지를 전송합니다.
                                res.end(JSON.stringify({message: "데이터 처리 중 오류가 발생했습니다."}));
                            }else{//제대로 변환이 완료되었다면 정상 코드인 200코드와 함께 js객체를 json으로 변환하여 반환해 줍니다.
                                res.writeHead(200, {'Content-Type': 'application/json'});
                                res.end(JSON.stringify(result));
                            }
                        
                        });
                             
                    });
                    
                });
                api3.on('error',(err)=>{  //저 http요청에서 모든 오류를 담당하는 부분입니다.
                    console.error(err); //에러 메세지를 콘솔에 보여줍니다.
                    res.writeHead(500,{'Content-Type':'application/json'}) //500오류코드와 함께 json 형태로 메세지를 전달하여 줍니다.
                    res.end(JSON.stringify({message: "외부 API 요청 오류."}));
                })
                api3.end(); //http요청을 완료하였다는 메서드입니다.
            }else if(parseurl.pathname=='/api/event'){  //이부분은 zio데이터베이스에 저장된 내용으로 그 장소,주소 주변에 있는 행사를 조회해 줍니다.
                const os=encodeURIComponent(parseurl.query.os|| "ETC"); //핸드폰에 os를 작성해 줍니다(IOS,AND,WIN,ETC)
                const selindex=parseInt(parseurl.query.selindex,10); //조회하고싶은 데이터베이스에 id번호를 입력합니다.
                const radius=encodeURIComponent(parseurl.query.radius||"1000"); //그 장소,주소 반경 m로 조회할지를 입력합니다.

                const zioList=await Zio.findOne({ //zio데이터베이스에서 selindex와 같은 id에 x,y좌표를 불러옵니다.
                    attributes:['x','y'],
                    where:{
                        id:selindex,
                    },
                });
                
                if(zioList){ //만약 ziolist가 존재할시 작동됩니다.
                    console.log(zioList)
                    const x=encodeURIComponent(zioList.dataValues.x); //데이터베이스에 x,y값을 api 매개변수로 사용하기위해 변수에 저장해 줍니다.
                    const y=encodeURIComponent(zioList.dataValues.y);  //인코드를 하는 이유는 특수문자가 존재할시url에 구조를 무너뜨릴수 있기에 이를 사용. .
                    option.hostname='apis.data.go.kr';  //api 주소를 작성해 줍니다.
                    option.path=`/B551011/KorService1/locationBasedList1?serviceKey=${process.env.KEY}&MobileOS=${os}&mapX=${x}&mapY=${y}&radius=${radius}&MobileApp=openapi&_type=json`;
                    //경로와 매개변수들인 ,x,y,radius를 포함해서 작성해 줍니다.

                    const api4=http.request(option,(apiRes)=>{ //해당 url주소로 요청해 줍니다.
                        let data='';
                        apiRes.on('data',(chuck)=>{ //api 호출에 대한 결과로 데이터조각들을 위에 data변수에 담아 하나로 만들어 줍니다.
                            data+=chuck;
                        });
                        apiRes.on('end',()=>{
                            try{
                                const result=JSON.parse(data);  //해당 데이터를 js객체로 변환해준뒤 200정상코드와 다시 json으로 변환하여 값을 전달해줍니다.
                                res.writeHead(200, {'Content-Type': 'application/json'});
                                res.end(JSON.stringify(result));
                            }catch(error){ //이 변환 과정에서 오류가 나올시 500코드와 메세지를 전송해줍니다.
                                res.writeHead(500, {'Content-Type': 'application/json'});
                                res.end(JSON.stringify({message: "서버에서 데이터를 처리하는 중 문제가 발생했습니다."}));             
                            }
                        });

                    });
                    api4.on('error',(err)=>{ //http코드에 전체 예상치 못한 코드를 처리하는 부분입니다.
                        console.error(err); //500코드와 메세지를 호출해줍니다.
                        res.writeHead(500, {'Content-Type': 'application/json'});
                        res.end(JSON.stringify({message: "외부 API 요청 에러."}));
                    })
                    api4.end();
                }else{ //만약 ziolist가 존재하지 않을시 이db에 내용이 없다는 메세지와 함께 404오류를 전송해줍니다.
                    res.writeHead(404, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({message: "Zio 에 존재하지 않는 ID."}));
                }
            }else if(parseurl.pathname=='/api/apart/list'){ //이부분은 apart데이터베이스에 저장한 내용 전부를 불러오는 라우터부분입니다.
                try{
                    const apartList=await Apart.findAll({}); //아파트에 대한 정보를 모두 가져옵니다.
                    res.writeHead(200,{'Content-Type': 'application/json'}); //200코드와 가져온 db내용들을 json으로 변환한후 전송해집니다.
                    res.end(JSON.stringify(apartList));
                }catch(error){ //데이터베이스를 가져오지 못하거나 전송에 문제가 생길시 오류코드와 에러메세지를 전송해 줍니다.
                    console.log(error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Internal Server Error' }));
                }
            }

            else if(parseurl.pathname=='/api/zio/list'){//이번에는 zio 데이터베이스에 저장되어 있는 내용들을 전부 불러옵니다.
                try{
                    const ZioList=await Zio.findAll({}); //여기서 zio내용을 전부 불러오고
                    res.writeHead(200,{'Content-Type': 'application/json'});
                    res.end(JSON.stringify(ZioList)); //이부분에서 클라이언트에게 json형식으로 변환하여서 내용을 전송합니다.
                }catch(error){ //실행중 문제가 존제시에 500코드와 함께 메세지를 전송하여 줍니다.
                    console.log(error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Internal Server Error' }));
                }
            }
            else{//이부분은 get요청중에서 정해지지 않은 라우터로 접근시 없는 라우터라는 메세지를 보내줍니다
                res.writeHead(404,{'Content-Type':'application/json'});
                res.end(JSON.stringify({message:"라우터가 없습니다."}));
            }
        }
        else if(req.method==='POST'){ //이번에는 post 방식으로 요청시 응답해주는 부분입니다.
            if(parseurl.pathname=='/api/apart/select'){ //이부분은 apart 데이터베이스에 body에 입력한 내용을 저장하는 부분입니다.
                let body='';
                req.on('data',(data)=>{ //클라이언트에서 body부분에 데이터를 보낸것들을 부분부분 전송해 하나로 입력받습니다.
                    body+=data;
                });
                req.on('end',async()=>{ //위에 데이터를 다 받아와 전송할 데이터가 없을시 실행 됩니다.
                    try{
                        console.log(body);
                        const result=JSON.parse(body); //받은 데이터를 js객체로 변경하여 줍니다.
                        if (!result.ApartName || !result.Build || !result.Amount || !result.location || !result.Area) {
                            res.writeHead(400, {'Content-Type': 'application/json'}); //이부분은 body부분에서 전달한 5개의 데이터중 없을시에는 정보 부족이라는 메세지를 보내줍니다.
                            res.end(JSON.stringify({message: "필드 정보 부족"}));
                            return;
                        }
                        // 아파트 데이터베이스에 전부 저장되어 있을때까지 기다립니다.
                        const newApart= await Apart.create({ //Apart데이터베이스에 데이터를 저장하여 줍니다.
                            apart_name:result.ApartName, //아파트이름입니다.
                            buildyear:result.Build, //건축년도입니다
                            amount:result.Amount,   //거래비용입니다.
                            location:result.location, //아파트의 주소입니다.
                            area:result.Area, //아파트의 크기가 어느정도인지 나타내는곳이다.
                        });

                        res.writeHead(200,{'Content-Type':'application/json'}); //저장을 정상적으로 완료할시 정상 200코드와 저장된 내용을 전송하여 줍니다.
                        res.end(JSON.stringify({message:"저장완료.",newApart}));
                    }catch(err){
                        res.writeHead(500, {'Content-Type': 'application/json'}); //이과정중 문제가 있을시에는 500 오류코드와 함께 저장이 되지 않았다는 메세지를 전송하여줍니다.
                        res.end(JSON.stringify({message: "저장이 되지 않았습니다."}));
                    }
                });
            }else if(parseurl.pathname=='/api/zio/select'){ //이번에는 api를 조회해서 특정 내용들을 zio데이터베이스에 내용을 저장합니다(x,y값,주소값)
                let body='';
                req.on('data',(data)=>{  // post로 전송한 body의 내용들을 데이터조각들로 보내서 하나의 데이터로 받습니다.
                    body+=data;
                });
                req.on('end',async()=>{// 전송한 데이터가 더 없을시 수행합니다.
                    let type='';
                    body=JSON.parse(body); //node에서 사용할수 있도록 js객체로 만들어 줍니다.
                    if(body.type=='지번명'){ //body에 지번명이라고 작성시 api에 지번명에 맞는 파라미터 값으로 변환해 줍니다.
                        type=encodeURIComponent('PARCEL');
                    }else if(body.type=='도로명'){//body에 도로명이라고 작성시 api에 도로명에 맞는 파라미터 값으로 변환해 줍니다.
                        type=encodeURIComponent('ROAD');
                    }
                    const address=encodeURIComponent(body.address); //body에 입력한 주소를 api조회하기위해서 파라미터 값으로 넣어줍니다.
                    option.hostname='api.vworld.kr';
                    option.path=`/req/address?key=${process.env.ZIO}&service=address&request=GetCoord&format=json&crs=epsg:4326&type=${type}&address=${address}`;
                    option.method="GET" //api주소와 경로,매개변수들을 작성하여 줍니다.

                    const api2=http.request(option,(apiRes)=>{ //api주소에 http요청을 통해서 json데이터를 받습니다.
                        let data='';
                        apiRes.on('data',(chuck)=>{ //data변수에 하나로 데이터들을 모읍니다.
                            data+=chuck;
                        });
                        apiRes.on('end',async()=>{
                            result=JSON.parse(data); //모은 데이터를 사용하기위해 js객체로 변환해 줍니다.
                            console.log(result);
                            if(result.response.status=='ERROR'){ //만약 api요청을통한 값이 제대로 오지 않을시
                                res.writeHead(404,{'Content-Type':'application/json'}) //404코드와 함께 메세지를 보내줍니다.
                                res.end(JSON.stringify({message:"매개변수 체크"}));
                                return;
                            }
                            const newZio= await Zio.create({ //응답으로 받은 js객체를 데이터베이스에 저장하여 줍니다.
                                x:result.response.result.point.x, //x값입니다.(위도)
                                y:result.response.result.point.y, //y값입니다.(경도)
                                location:result.response.refined.text, //x,y값에 의한 주소입니다.
                            });
                               
                            res.writeHead(200, {'Content-Type': 'application/json'}); //여기까지 제대로 저장시에 200코드와 성공메세지를 전송해줍니다.
                            res.end(JSON.stringify({message:"저장 완료"},newZio));
                        });
                    });
                    api2.on('error',(err)=>{ //api요청과 데이터베이스 저장할때 문제가 생길시
                        console.error(err); //콘솔에 에러메세지를 출력해주고 클라이언트에 오류메세지와 500코드를 전송합니다.
                        res.writeHead(500,{'Content-Type':'application/json'})
                        res.end(JSON.stringify({message: "외부 api호출 요청 실패."}));
                    });
                    api2.end();
                    
                        
                });   
            }
            else{//이부분은 post요청중에서 정해지지 않은 라우터로 접근시 없는 라우터라는 메세지를 보내줍니다
                res.writeHead(404,{'Content-Type':'application/json'});
                res.end(JSON.stringify({message:"라우터가 없습니다."}));
            }
        } else if(req.method==='DELETE'){ //클라이언트에서 delete 요청보낼시에 수행됩니다.
            const path=parseurl.pathname; //이부분은 경로부분을 받는 부분입니다.
            const trimme=path.replace(/^\/+|\/+$/g, ''); //라우터매개변수를 활용하기위해서 주소방식을 다시 배치해줍니다.
            if(trimme.match(/^api\/zio\/delete\/\d+$/)){ //라우터매개변수를 사용하여 zio데이터베이스에 저장된 id행 값을 조회해 그부분을 삭제하는 라우터부분입니다.
                const id=trimme.split('/')[3]; //id라우터매개변수가 '/'문자를 기준으로 나누어서 4번째에 위치한 변수를 저장합니다(id부분)
                try{
                    const deletelist=await Zio.destroy({ //시퀄라이즈 쿼리로 id변수와 zio테이블에 존재하는 id열 값과 맞는 것을 삭제해 줍니다.
                        where:{id:id},
                    });
                    if(!deletelist){ //만약 반환되는 값이 없다면.즉 zio테이블에 해당 id가 없을시
                        res.writeHead(404, { 'Content-Type': 'application/json' }); //실패했다는 메세지와 함께 404코드를 전송해 줍니다.
                        res.end(JSON.stringify({message:"삭제할 데이터가 존재하지 않습니다."}));
                    } 
                    res.writeHead(202, { 'Content-Type': 'application/json' });//정상적으로 모든게 성공시에는 202코드로 적용완료되었다는 표시와 메세지를 전송해줍니다.
                    res.end(JSON.stringify({message:"삭제 성공", deletelist}));
                }catch(e){
                    res.writeHead(500, { 'Content-Type': 'application/json' }); //이 모든 과정중 문제가 있을시 500오류코드와 함께 메세지를 전송해 줍니다.
                    res.end(JSON.stringify(JSON.stringify({ message: "서버 오류" })));
                }
            }
            else if(trimme.match(/^api\/apart\/delete\/\d+$/)){  //아파트 데이터베이스에 id값을 이용하여서 데이터를 삭제하는 부분입니다.
                const id=trimme.split('/')[3];  //위와 같이 trimme변수에서 '/'기호를 기준으로 데이터를 나누어서 그곳에서 4번째에 해당하는 데이터를 변수에 저장합니다.
                try{
                    const deleteApart=await Apart.destroy({ //시퀄라이즈 쿼리를 이용해서 apart테이블에 존재한 id열의 값과 id변수와 맞는데이터를 삭제하여 줍니다. 
                        where:{id:id},
                    });
                    if(!deleteApart) { //만약 삭제한 데이터가 존재하지 않을시에는 오류 코드인 404코드와 함께 오류메세지를 전송해 줍니다.
                        res.writeHead(404, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({message:"삭제할 데이터가 존재하지 않습니다."}));
                    } else { //만약 그외에 삭제가 정상적으로 되었다면.
                        res.writeHead(202, { 'Content-Type': 'application/json' }); //적용되었다는 202코드와 완료되었다는 json코드를 보내줍니다.
                        res.end(JSON.stringify({message:"삭제 성공", deleteApart}));
                    }
                }catch(e){ //이 전체 아파트데이터 삭제 과정중 오류있을시 500코드와 메세지를 전송해줍니다.
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(JSON.stringify({ message: "서버 오류" })));
                }
            }
            else{
                res.writeHead(404,{'Content-Type':'application/json'}); //이부분은 delete요청중에서 정해지지 않은 라우터로 접근시 없는 라우터라는 메세지를 보내줍니다.
                res.end(JSON.stringify({message:"라우터가 없습니다."}));
            }
        }
        else{//이부분은 post,delete,get 요청중외에 정해지지않은 요청으로 접근시 없는 라우터라는 메세지를 보내줍니다
            res.writeHead(404,{'Content-Type':'application/json'});
            res.end(JSON.stringify({message:"해당 요청은 존재하지 않습니다."}));
        }
    } catch(err){ //이 
        res.writeHead(500,{'Content-Type':'application/json'})
        res.end(err.message);
    }

}).listen(port,()=>{  //해당 포트번호를 통해서 클라이언트가 연결하는것을 대기합니다.
    console.log(`${port}번 포트에서 대기중.`);
});
