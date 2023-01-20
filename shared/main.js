"use strict";

//色初期化
let r = 255, g = 255, b = 255;

//初期化
const Peer = window.Peer;
const isFlipped = true;

//自身のストリーム＆キャンバス
let myStream;
let myCanvas;

//HTMLのID
const joinTrigger = document.getElementById('js-join-trigger');
const leaveTrigger = document.getElementById('js-leave-trigger');
const remoteVideos = document.getElementById('js-remote-streams');
const roomId = document.getElementById('js-room-id');
const yourName = document.getElementById('js-your-name');
const roomEnter = document.getElementById('room-enter');
const roomJoin = document.getElementById('room-join');
let efimg = document.querySelector("canvas.effect_image");

//ビデオ入力
const localVideo = document.getElementById("videoTag"),
constraints = {
  audio: false,
  video: true,
};
localVideo.style.display = "none";

navigator.mediaDevices.getUserMedia(constraints).then(function ( stream){
  localVideo.srcObject = stream;
  localVideo.onloadedmetadata = function(e){
    localVideo.play();
  };
})
.catch( function ( err ){
  console.log(err.name + ": " + err.message);
});

//手の関節位置
let keypointsHand = [];
//左手右手
let keyHandness = [];

//ハート
var heart = [];
var NUM_OF_HEARTS = 15;

//花火
let fw = [];
let colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff', '#ffffff'];
var NUM_OF_FIRE = 10;

//桜
var sakuraNum = 100;
var fubuki = [];
var clr = [ ];

//音符
var mus = [];
var dots =  [];
var count = 20;
var noiseval = 0.01;
/*
//背景の色初期化
let re, gr, bl, blur, colnum;
*/

//片手のフラッグ
let flag_one ={
  thumb: false,
  index: false,
  middle: false,
  ring: false, 
  pinky: false,
};
//もう片手のフラッグ
let flag_two ={
  thumb: false,
  index: false,
  middle: false,
  ring: false, 
  pinky: false,
};

//認識のためのflag
let paaFlag;
let paapoint;
let paacount;

//ランドマーク検出
function onHandsResults(results){
  keypointsHand = results.multiHandLandmarks;
  keyHandness = results.multiHandedness;
}
//ハンドトラッキング
const hands = new Hands({
  locateFile:(file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
  }
});

//手の検出オプション
hands.setOptions({
  selfieMode: isFlipped, //falseは、入力画像をビデオストリームとして扱う　trueは全ての入力画像で手の検出
  maxNumHands: 2, // 今回、簡単化のため検出数の最大1つまでに制限
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7,
});
hands.onResults(onHandsResults);

//画像
let imagePNG;
let One_Red,One_White,One_Blue,One_Green,One_Yellow;
let Two_Red,Two_White,Two_Blue,Two_Green,Two_Yellow;
let clapImage;

let t = 0;

//画像読み込み先
function preload(){
  imagePNG = loadImage("./heart.png");

  One_Red  = loadImage("./note/one_red.png");
  One_White  = loadImage("./note/one_white.png");
  One_Blue  = loadImage("./note/one_blue.png");
  One_Green  = loadImage("./note/one_green.png");
  One_Yellow  = loadImage("./note/one_yellow.png");

  Two_Red  = loadImage("./note/two_red.png");
  Two_White  = loadImage("./note/two_white.png");
  Two_Blue  = loadImage("./note/two_blue.png");
  Two_Green  = loadImage("./note/two_green.png");
  Two_Yellow  = loadImage("./note/two_yellow.png");

  clapImage = loadImage("./img/clap.png")
}

/////////////////////////////////////////固定///////////////////////////////////////////////
async function setup(){

  myCanvas = createCanvas(320,180);
  efimg = createGraphics(640, 360);

  efimg.position(0,150);
  efimg.style("display","");

//出力
const camera = new Camera(localVideo, {
  onFrame: async () => {
    await hands.send({ image: localVideo });
  },
  width: 640,
  height: 360,
});
camera.start();

  // eslint-disable-next-line require-atomic-updates
  const peer = (window.peer = new Peer({
    key: window.__SKYWAY_KEY__,
    debug: 3,
  }));

  // Register join handler
  joinTrigger.addEventListener('click', () => {
    // Note that you need to ensure the peer has connected to signaling server
    // before using methods of peer instance.
    if (!peer.open) {
      return;
    }

    roomEnter.style.display ="none";
    roomJoin.style.display ="block";

    const room = peer.joinRoom(roomId.value, {
      mode: 'sfu',
      stream: myStream,
    });

    room.once('open', () => {
      console.log('=== You joined ===\n');
    });
    room.on('peerJoin', () => {
      console.log(`=== ${yourName.value} joined ===\n`);
    });

    // Render remote stream for new peer join in the room
    room.on('stream', async stream => {
      const newVideo = document.createElement('video');
      newVideo.srcObject = stream;
      newVideo.playsInline = true;
      // mark peerId to find it later at peerLeave event
      remoteVideos.append(newVideo);
      await newVideo.play().catch(console.error);
    });

    // for closing room members
    room.on('peerLeave', peerId => {
      const remoteVideo = remoteVideos.querySelector(
        `[data-peer-id="${peerId}"]`
      );
      remoteVideo.srcObject.getTracks().forEach(track => track.stop());
      remoteVideo.srcObject = null;
      remoteVideo.remove();
    });

    // for closing myself
    room.once('close', () => {
      Array.from(remoteVideos.children).forEach(remoteVideo => {
        remoteVideo.srcObject.getTracks().forEach(track => track.stop());
        remoteVideo.srcObject = null;
        remoteVideo.remove();
      });
    });

    leaveTrigger.addEventListener('click', () => {
      room.close() , { once: true };
      
      roomJoin.style.display ="none";
      roomEnter.style.display ="block";
    });
    

  });

  peer.on('error', console.error);

  //ハート
  for( let i = 0; i < NUM_OF_HEARTS; i++){
    heart.push(new Hearts());
  }
  
  //花火
  for(let i=0; i<NUM_OF_FIRE; i++){
	fw.push(new Fire());
  }

  //桜
  for( let i = 0; i < sakuraNum; i++){
    fubuki.push(new Sakura());
  }
  
  //桜カラー配列
  clr.push(color(244, 191, 252, 150));
  clr.push(color(255, 219, 248, 150));
  clr.push(color(246, 204, 252, 150));

  //音符
  mus= [ One_Red, One_White, One_Blue, One_Green, One_Yellow, Two_Red,Two_White,Two_Green,Two_Blue,Two_Yellow];
  pointinit();
  for(var i = 0; i < count; i++){
    dots[i].initMe();
  }
}

/////////////////////////////////////ループ//////////////////////////////////////////
function draw(){
  clear();
  background("rgba(255, 255, 255, 0.2)");
 
  drawHands(); 

  myStream = myCanvas.elt.captureStream(frameRate());

}


//----------------------------------------------------------------------------------------------------------------------------------------//
function drawHands(){

  push();
  displayWidth = width;
  displayHeight = (width * myCanvas.height) /myCanvas.width;
  pop();
  //手を検出しなかった時リターンする
  if(keypointsHand.length <= 0) return;

  //片手だけの動作
    if(keypointsHand.length == 1){
              
        //指先の配列
        const tip = {
          thumb: keypointsHand[0][4],
          index: keypointsHand[0][8],
          middle: keypointsHand[0][12],
          ring: keypointsHand[0][16],
          pinky: keypointsHand[0][20],
        };
        //根元の配列
        const mcp = {
          middle: keypointsHand[0][9],
          pinky: keypointsHand[0][17],
        };
        //距離算出
        const distance = {
          index: dist(mcp.middle.x,mcp.middle.y, tip.index.x, tip.index.y),
          middle: dist(mcp.middle.x, mcp.middle.y, tip.middle.x, tip.middle.y),
          ring: dist(mcp.pinky.x, mcp.pinky.y, tip.ring.x, tip.ring.y),
          pinky: dist(mcp.pinky.x, mcp.pinky.y, tip.pinky.x, tip.pinky.y),
          thumb: dist(mcp.pinky.x, mcp.pinky.y, tip.thumb.x, tip.thumb.y),
        };
    
        //掌
        const palmarea = {
          ht : dist( keypointsHand[0][9].x, keypointsHand[0][9].y, keypointsHand[0][0].x, keypointsHand[0][0].y),
          wt : dist( keypointsHand[0][2].x, keypointsHand[0][2].y, keypointsHand[0][17].x, keypointsHand[0][17].y),
        };

        for(const property in distance ){
          if(distance[property] > 0.15){
            flag_one[property] = true;
          }
          if(distance[property] <= 0.15){
            flag_one[property] = false;
          }
    

          //人差し指があがってるとき
          //残像が残るペイント
          if(flag_one.index == true && flag_one.middle == false && flag_one.ring == false&& flag_one.pinky == false && flag_one.thumb == false){
            penlight_remain(tip.index);
          }

          //パーにしている時
          //光る円(ペンライト)
          if(flag_one.thumb == true && flag_one.index == true && flag_one.middle == true && flag_one.ring == true && flag_one.pinky == true ){
      
            //拍手した時
            if (palmarea.wt > 0.18){
              efimg.clear();
              penlight(tip.index, displayWidth, displayHeight);
            }
            if(palmarea.wt < 0.10){
              if( frameCount % 7 == 0 || frameCount % 7 == 1 || frameCount % 7 == 2){
                efimg.clear();

                push();
                rotate(PI/4);
                translate(displayWidth/3, -displayHeight*4/3);
                efCurve(random()*(displayWidth/2),random()*(displayHeight/2), random()*(100-40)+40, random()*(40-10)+10, 5);
                //efThree(random()*(displayWidth/2),random()*(displayHeight/2), random()*(100-40)+40, random()*(40-20)+20);
                pop()

                push()
                rotate(5*PI/4);
                translate(-(displayWidth*3/4), -displayHeight*3/4);
                efCurve(random()*(displayWidth/2),random()*(displayHeight/2), random()*(100-40)+40, random()*(40-10)+10, 5);
                //efThree(random()*(displayWidth/2),random()*(displayHeight/2), random()*(100-40)+40, random()*(40-20)+20);
                pop();

                push();                           
                image(
                  clapImage,
                  random()*displayWidth,
                  random()*displayHeight,
                  imagePNG.width*0.10,
                  imagePNG.height*0.10
                );
                pop();
              }
            }
          }

          //ピースの時
          //キラキラ
          if(flag_one.thumb == false && flag_one.index == true && flag_one.middle == true && flag_one.ring == false && flag_one.pinky == false ){
            efimg.clear();
            Star(random()*displayWidth,random()*displayHeight,random()*10)
          }
        
          //親指を上げている
          if(flag_one.thumb == true && flag_one.index == false && flag_one.middle == false && flag_one.ring == false && flag_one.pinky == false ){
      
            //いいねのポーズ
            //花火
            if( tip.thumb.y - tip.middle.y  < 0){                 
              efimg.clear();
              for(let f of fw){
              f.run();
            }
          }
      
            //ブーイング
            //桜
            else{
              efimg.clear();
            }
          }
    
          //メロイックサイン
          if(flag_one.thumb == false && flag_one.index == true && flag_one.middle == false && flag_one.ring == false && flag_one.pinky == true ){
              efimg.clear();
              for( var i = 0; i < count; i++){
                dots[i].drawMe();
                dots[i].updateMe();
              }
          }
        }
      }
        
      //両手の時に動作
      else if( keypointsHand.length == 2){

        let tip_r = [];
        let tip_l = [];

        //右手と左手の配列格納
        //keyhandness[0]が右の時、左の時で分けて格納
        if( ( keyHandness[0].label).indexOf("Right") == 0){
          tip_r = {
              thumb: keypointsHand[0][4],
              index: keypointsHand[0][8],
              middle: keypointsHand[0][12],
              ring: keypointsHand[0][16],
              pinky: keypointsHand[0][20],
          };
          tip_l = {
              thumb: keypointsHand[1][4],
              index: keypointsHand[1][8],
              middle: keypointsHand[1][12],
              ring: keypointsHand[1][16],
              pinky: keypointsHand[1][20],
          };
        }
        else if( (keyHandness[0].label).indexOf("Left") == 0){
          tip_l = {
              thumb: keypointsHand[0][4],
              index: keypointsHand[0][8],
              middle: keypointsHand[0][12],
              ring: keypointsHand[0][16],
              pinky: keypointsHand[0][20],
          };
          tip_r = {            
              thumb: keypointsHand[1][4],
              index: keypointsHand[1][8],
              middle: keypointsHand[1][12],
              ring: keypointsHand[1][16],
              pinky: keypointsHand[1][20],
          };
        }

        //両手同士の距離配列
        const distance_h = {
          index: dist(tip_r.index.x,tip_r.index.y, tip_l.index.x, tip_l.index.y),
          middle: dist(tip_r.middle.x, tip_r.middle.y, tip_l.middle.x, tip_l.middle.y),
          ring: dist(tip_r.ring.x, tip_r.ring.y, tip_l.ring.x, tip_l.ring.y),
          pinky: dist(tip_r.pinky.x, tip_r.pinky.y, tip_l.pinky.x, tip_l.pinky.y),
          thumb: dist(tip_r.thumb.x, tip_r.thumb.y, tip_l.thumb.x, tip_l.thumb.y),
        };

        //片手を両手認識してしまった(誤認識をした)時の処理
        //片手の処理と同じ？
        if( (keyHandness[0].label).indexOf(keyHandness[1].label) == 0){

        }
        //両手でポーズした時の処理
        else{
          
          for(const property in distance_h ){
        
              //両手の近さが近いときはtrue
              if(distance_h[property] <= 0.05){
                  flag_two[property] = true;
              }
              if(distance_h[property] > 0.05){
                  flag_two[property] = false;
              }
        
              //丸の形（両手が近い　bad 小指の距離は関係なくしている ）
              if(flag_two.thumb == true && flag_two.index == true && flag_two.middle == true && flag_two.ring == true ){
          
              //両手でハートを作った時の処理
                  if(0.20 <= dist(tip_l.thumb.x, tip_l.thumb.y, tip_l.pinky.x, tip_l.pinky.y) <= 0.3 && 0.20 <= dist(tip_r.thumb.x, tip_r.thumb.y, tip_r.pinky.x, tip_r.pinky.y) <= 0.3){
                      efimg.clear();
                      for( let b of heart){
                          b.move();
                          b.show();
                      }
                  }
              //丸の時
              //桜
                  else{
                    efimg.clear();
                    for(let i = 0; i < sakuraNum; i++){
                      fubuki[i].draw();
                      fubuki[i].move();
                    }
                  }
          }
        }
      }

  }
}

//---------------------------------------------------------------------------------------------------------------------------------------//
  //ダイヤ描画
  function drawTwinkle( x, y, r){
    push();
    translate(x,y);

    beginShape();
    for(let theta = 0; theta < 360; theta++){
    vertex(r * pow(cos(theta), 3), r * 1.4 * pow(sin(theta), 3));
    }
    endShape(CLOSE)
    pop();
  }
  //効果線-曲線
  function efCurve( x0, y0, w, h, a){

    push();

    noFill();
    strokeWeight(3);
    stroke(255);
    
    bezier(x0,       y0+h,   x0+a,     y0+h,     x0+ w/3,    y0+h/5+a, x0+w/3,   y0+h/5);
    bezier(x0+w/3,   y0+h/5, x0+w/3+a, y0+h/5+a, x0+w*2/3-a, y0+h/5+a, x0+w*2/3, y0+h/5);
    bezier(x0+w*2/3, y0+h/5, x0+w*2/3, y0+h/5+a, x0+w-a,     y0+h,     x0+w,     y0+h);

    pop();
  }
  //効果線-直線
  function efThree(x0, y0, w, h){

    push();

    noFill();
    strokeWeight(3);
    stroke(255);

    line(x0,     y0+h/2, x0+w/4,   y0+h);
    line(x0+w/2, y0,     x0+w/2,   y0+h);
    line(x0+w,   y0+h/2, x0+3*w/4, y0+h);

    pop();
  }


  //キラキラさせる
  function Star( x, y, r){
    push();

    drawingContext.shadowBlur = 30;
    drawingContext.shadowColor = color(255);

    noFill();
    strokeWeight(5);
    stroke(255);
    drawTwinkle(x,y,r);
    pop();

  }

  //ペンライトの動き
  function penlight(position, w, h){
    push();

    drawingContext.shadowBlur = 30;
    drawingContext.shadowColor= color(r, g, b)
    //fill(255
    noStroke();
    fill(255);
    ellipse(position.x * w, position.y * h, 30 );
    pop();
  }

  function penlight_remain(position){
    push();
    let T, A, R;
    //drawingContext.shadowBlur = 25;
    //drawingContext.shadowColor= color(r, g, b)
    //fill(255);
    t+=.001
    efimg.colorMode(HSB);
    efimg.blendMode(BLEND);
    efimg.background(0, .1);
    efimg.noStroke();
    efimg.blendMode(ADD);
    for( let a = 0; a < 3; a+=.005){
      efimg.fill(a*60,g,b, T=tan(a*4+t*9)/2);
      efimg.circle(cos(R=a*a-t)*360*sin(A=a+t*3+sin(R+t))+360,sin(R)*360*cos(A)+360,4/T);
    }
    pop();
  }


//ハート作成
class Hearts{
  constructor(){
    this.x=random(width);
    this.y=height;
    this.speedY = random(-3, -1);
  }

  move(){
    this.x += random(-5, 5);
    this.y += this.speedY;

    if( this.isOffScreen()){
      this.x = random(width);
      this.y = height;
      this.speedY = random(-3, -1);
    }
  }

  show(){
    push();
    imageMode(CENTER);
    //tint(255,100);
    image(
      imagePNG,
      this.x,
      this.y,
      imagePNG.width*0.10,
      imagePNG.height*0.10
    );
    pop();
  }

  isOffScreen(){
    return this.y < 0;
  }
}


//花火
class Fire{
	constructor(){
		this.p1 = 0
		this.p2 = 0
		this.lifeSpan = 100;
		this.ang = random(10);
		this.aStep = random(-1, 1)*0.001;
		this.sets();
	}

	show(){
		push();
    drawingContext.shadowBlur = 20;
    drawingContext.shadowColor= this.col;
		translate(this.x, this.y);
		rotate(this.ang);
		stroke(this.col);
		for(let i=0; i<this.num; i++){
			rotate(TAU/this.num);
			stroke(this.col);
			strokeWeight(2);
			line(this.p1, 0, this.p2, 0);
			stroke(255);
			strokeWeight(1);
			line(this.p1, 0, this.p2, 0);	
		}
		pop();
	}

	move(){
		this.life--;

		if(this.lifeSpan > this.life && this.life > 0){
			let nrm = norm(this.life, this.lifeSpan, 1);
			this.p1 = lerp(0, this.s/2, nrm**0.8);
			this.p2 = lerp(0, this.s/2, nrm**2);
			this.y += 0.5;
			this.ang += this.aStep;
		}
		if(this.life == 0){
			this.sets();
		}
	}

	sets(){
		this.life = this.lifeSpan + int(random(100));
		this.num = int(random(8, 20));
		this.x = random(-0.1, 1.1)*width;
		this.y = random(-0.1, 1.1)*height;
		this.s = random(120, 350);
		this.col = random(colors);
	}

	run(){
		if(this.life < this.lifeSpan)this.show();
		this.move();
	}
}

//桜

class Sakura {
    constructor() {
      var n = 4;
      var A, md, r, R, x, y;
  
      this.xDef = random(width);
  
      this.xAmp = random(50, 100);
      this.xSpeed = random(1, 2);
      this.xTheta = random(360);
  
      this.ox = this.xDef + this.xAmp * sin(radians(this.xTheta));
      this.oy = random(height);
      this.rotateT = random(360);
      this.size = random(20, 50);
  
      this.ySpeed = this.size / 20;
      this.sizeYScale = 1;
      this.sizeYT = random(360);
      this.sizeYSpeed = this.size / 30;
      this.c = floor(random(3));
  
      this.draw = function () {
        fill(clr[this.c]);
  
        push();
        noStroke();
        translate(this.ox, this.oy);
        rotate(radians(this.rotateT));
        beginShape();
        for (var t = 0; t < 360 / 4; t++) {
          A = n / PI * radians(t);
  
          md = floor(A) % 2;
  
          r = pow(-1, md) * (A - floor(A)) + md;
  
          R = r + 2 * calcH(r);
  
          x = this.size * R * cos(radians(t));
          y = this.size * this.sizeYScale * R * sin(radians(t));
  
          vertex(x, y);
        }
        endShape(CLOSE);
        pop();
      };
  
      this.move = function () {
        this.ox = this.xDef + this.xAmp * sin(radians(this.xTheta));
        this.xTheta += this.xSpeed;
  
        this.oy += this.ySpeed;
        this.sizeYT += this.sizeYSpeed;
        this.sizeYScale = abs(sin(radians(this.sizeYT)));
  
        if (this.oy > height + this.size) {
          this.oy = -this.size;
        }
      };
    }
}
  
function calcH(x){
    if( x < 0.8){
      return 0;
    }
    else{
      return 0.8 - x;
    }
}

//音符

function pointinit(){
    for( var i = 0; i < count; i++){
      dots[i] = new ShowObj();
    }
  }
  function ShowObj(){
    var x, y;
    var sizeScale;
    var rotAngle;
    var rotSpeed;
    var speed, xnoise;
    var imgCol;
  }
  
  ShowObj.prototype.initMe = function(){
    this.x = random(0, width);
    this.y = random(0, height);
    this.imgCol = floor(random(0, 10));
    this.sizeScale = random(0.01, 0.10);
    this.rotAngle = 0;
    this.rotSpeed = random(-3, 3);
    this.speed = random(0.5, 2);
    this.xnoise = random(100);
  }
  
  ShowObj.prototype.updateMe = function () {
    this.x = this.x + noise(this.xnoise) * 2 - 1;
    this.xnoise = this.xnoise + noiseval;
    this.y = this.y + this.speed;
    if (this.y > height + 100) {
        this.initMe();
        this.y = -100;
    }
    this.rotAngle += this.rotSpeed;
  }
  ShowObj.prototype.drawMe = function () {
    push();
    translate(this.x, this.y);
    rotate(radians(this.rotAngle));
    scale(this.sizeScale, this.sizeScale);
    //tint(255, 30);
    image(mus[this.imgCol], -(mus[this.imgCol].width / 2), -(mus[this.imgCol].height / 2));
    pop();
  }
  
