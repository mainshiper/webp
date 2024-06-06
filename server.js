//서버 셋팅을 위한 기본셋팅(express 라이브러리)
const ejs = require('ejs');
const express = require('express');
const app =express();
const port=8080;

app.set('view engine', ejs);
app.set('views','./views');
//라우터
app.listen(8080, function(){ //listen(서버띄울 포트번호, 띄운 후 실행할 코드)
    console.log('listening on 8080')
});

//누군가가 /pet으로 방문을 하면 pet관련된 안내문을 띄워주자 

app.get('/pet',function(요청,응답){
    응답.send('펫용품 쇼핑할 수 있는 페이지입니다.');
});
app.get('/beauty',function(요청,응답){
    응답.send('뷰티용품 쇼핑할 수 있는 페이지입니다.');


});
app.get('/',function(요청,응답){ //홈페이지
    응답.sendFile(__dirname + '/index.html')
});

