"use strict";

//ログインページアニメーション
$(".input").focusin(function () {
  $(this).find("span").animate({ "opacity": "0" }, 200);
});

$(".input").focusout(function () {
  $(this).find("span").animate({ "opacity": "1" }, 300);
});
//ローディングアニメーション
$(function () {

  //ページの読み込みが完了してなくても5秒後にアニメーションを非表示にする
  setTimeout(function () {
    $('.loader-bg').fadeOut(700);
  }, 5000);
});

//色初期化
let r = 255, g = 255, b = 255;

//初期化
const Peer = window.Peer;
let peer;

//ストリーム＆キャンバス
let myStream;
let lay, Canvas, effect;
//ルームの宣言
let room;

//ルームに入ったかどうか
let roomFlag = false;

//回数の配列初期化
let poseNUM = 8;

//盛り上がりのフラッグ
let enjoy_flag = poseNUM;
let enjoy_id = poseNUM;

//モデル
let model;
const MODEL_URL = '../model/model.json';
let id, result;

//HTMLのID
const joinTrigger = document.getElementById('js-join-trigger');
const remoteVideos = document.getElementById('js-remote-streams');
const roomId = document.getElementById('js-room-id');
const yourName = document.getElementById('js-your-name');
const comment = document.getElementById('comment');

const roomEnter = document.getElementById('room-enter');
const roomJoin = document.getElementById('room-join');
const roomIn = document.getElementById("room-in");

const header = document.getElementById("header");
const roomLeave = document.getElementById("leave-room");
const enterRoom = document.getElementById("enter-room");

let cav = document.getElementById("canvas");
let layer01 = document.getElementById('layer');
let layer_enjoy = document.getElementById('enjoy_effect');

const user = document.getElementsByName('user');

//ビデオ入力
const localVideo = document.getElementById("videoTag"),
  constraints = {
    audio: false,
    video: true,
  };
localVideo.style.display = "none";

navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
  localVideo.srcObject = stream;
  localVideo.onloadedmetadata = function (e) {
    localVideo.play();
  };
})
  .catch(function (err) {
    console.log(err.name + ": " + err.message);
  });

//手の関節位置
let keypointsHand = [];
const isFlipped = true;

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
var clr = [];

//音符
var mus = [];
var dots = [];
var count = 20;
var noiseval = 0.01;

//炎
let system = [];

//ランドマーク検出
function onHandsResults(results) {
  keypointsHand = results.multiHandLandmarks;
}
//ハンドトラッキング
const hands = new Hands({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
  }
});

//手の検出オプション
hands.setOptions({
  selfieMode: isFlipped, //falseは、入力画像をビデオストリームとして扱う　trueは全ての入力画像で手の検出
  maxNumHands: 1, // 今回、簡単化のため検出数の最大1つまでに制限
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7,
});
hands.onResults(onHandsResults);

//画像
let imagePNG;
let One_Red, One_White, One_Blue, One_Green, One_Yellow;
let Two_Red, Two_White, Two_Blue, Two_Green, Two_Yellow;
let clapImage;

let t = 0;

//画像読み込み先
function preload() {
  imagePNG = loadImage("./heart.png");

  One_Red = loadImage("./note/one_red.png");
  One_White = loadImage("./note/one_white.png");
  One_Blue = loadImage("./note/one_blue.png");
  One_Green = loadImage("./note/one_green.png");
  One_Yellow = loadImage("./note/one_yellow.png");

  Two_Red = loadImage("./note/two_red.png");
  Two_White = loadImage("./note/two_white.png");
  Two_Blue = loadImage("./note/two_blue.png");
  Two_Green = loadImage("./note/two_green.png");
  Two_Yellow = loadImage("./note/two_yellow.png");

  clapImage = loadImage("./img/clap.png")
}
/////////////////////////////////////////固定///////////////////////////////////////////////
async function setup() {

  //デフォルトのキャンバス消去
  Canvas = createCanvas(320, 180);
  Canvas.parent(cav);
  Canvas.style("display", "none");

  //映像
  lay = createGraphics(320, 180);
  lay.parent(layer01);
  lay.style("display", "");
  lay.id('mylayer');

  //盛り上がりエフェクト
  effect = createCanvas(windowWidth, windowHeight);
  effect.parent(layer_enjoy);
  effect.style("display", "");

  //出力
  const camera = new Camera(localVideo, {
    onFrame: async () => {
      await hands.send({ image: localVideo });
    },
    width: 320,
    height: 180,
  });
  camera.start();

  // eslint-disable-next-line require-atomic-updates
  peer = (window.peer = new Peer({
    key: window.__SKYWAY_KEY__,
    debug: 3,
  }));

  // ログイン(JOIN)ボタンを押したとき
  joinTrigger.addEventListener('click', () => {

    if (roomId.value == "") {
      alert("部屋の名前を入力してください")
      roomEnter.style.display = "block";
      roomIn.style.display = "none";
    }
    else {
      //ルームに移動
      roomEnter.style.display = "none";
      roomIn.style.display = "block";

      header.textContent = roomId.value + "'s Room";
      comment.textContent = yourName.value + "hello! You're??"
      // Note that you need to ensure the peer has connected to signaling server
      // before using methods of peer instance.
      if (!peer.open) {
        return;
      }
    }
  });

  //部屋から離れるを押したとき
  roomLeave.addEventListener('click', () => {
    //参加画面に戻る
    roomIn.style.display = "none";
    roomEnter.style.display = "block";
  });


  //部屋に入るを押したとき
  enterRoom.addEventListener('click', () => {

    //入ったことを示す
    roomFlag = true;
    //参加者の場合
    if (user.item(0).checked == true) {

      //自身のストリーム含んで部屋に参加
      room = peer.joinRoom(roomId.value, {
        mode: 'sfu',
        stream: myStream,
      });

      //映像画面に遷移
      roomIn.style.display = "none";
      roomJoin.style.display = "block";

      //他のユーザから送信されたデータを受信した時
      room.on("data", ({ src, data }) => {
        //ローカルストレージにすでにそのキーがなかった場合
        if (localStorage.hasOwnProperty(src) == false) {
          localStorage.setItem(src, data);
        }
        else {
          //データが一緒じゃなかったら
          if (localStorage.getItem(src) !== data) {
            localStorage.setItem(src, data);
          }
        }

        //同じポーズをしている人の割合が一番多いポーズを取り出す
        if (localStorage.length > 0) {
          let c = Array(poseNUM+1);
          c.fill(0);
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const num = localStorage.getItem(key);
            if( parseInt(num) !== poseNUM*2 ){
              const n = parseInt(num) % poseNUM;
              c[n] += 1
            }
          }
          if (Math.max(...c) >= 2) {
            enjoy_flag = maxIndex(c);
          }
        }
      });

      //他の参加者のストリームを検出した時
      room.on('stream', async stream => {
        const newVideo = document.createElement('video');
        newVideo.srcObject = stream;
        newVideo.playsInline = true;
        // mark peerId to find it later at peerLeave event
        newVideo.setAttribute('data-peer-id', stream.peerId);
        remoteVideos.append(newVideo);
        await newVideo.play().catch(console.error);
      });

      //他の参加者が退出した時
      room.on('peerLeave', peerId => {
        const remoteVideo = remoteVideos.querySelector(
          `[data-peer-id="${peerId}"]`
        );
        remoteVideo.srcObject.getTracks().forEach(track => track.stop());
        remoteVideo.srcObject = null;
        remoteVideo.remove();
      });

      //自分が退出した時
      room.once('close', () => {
        Array.from(remoteVideos.children).forEach(remoteVideo => {
          remoteVideo.srcObject.getTracks().forEach(track => track.stop());
          remoteVideo.srcObject = null;
          remoteVideo.remove();
        });
      });
    }
    //アーティストの場合
    else {
      layer01.style.display = "none";

      //自身のストリームを送信しない受信のみモードにする
      const room = peer.joinRoom(roomId.value, {
        mode: 'sfu',
      });

      //映像画面に遷移
      roomIn.style.display = "none";
      roomJoin.style.display = "block";


      //他のユーザから送信されたデータを受信した時
      room.on("data", ({ src, data }) => {
        //ローカルストレージにすでにそのキーがなかった場合
        if (localStorage.hasOwnProperty(src) == false) {
          localStorage.setItem(src, data);
        }
        else {
          //データが一緒じゃなかったら
          if (localStorage.getItem(src) !== data) {
            localStorage.setItem(src, data);
          }
        }

        //同じポーズをしている人の割合が一番多いポーズを取り出す
        if (localStorage.length > 0) {
          let c = Array(poseNUM+1);
          c.fill(0);
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const num = localStorage.getItem(key);
            if( parseInt(num) !== poseNUM*2 ){
              const n = parseInt(num) % poseNUM;
              c[n] += 1
            }
          }
          if (Math.max(...c) >= 2) {
            enjoy_flag = maxIndex(c);
          }
        }
      });

      //他の参加者が参加してきたとき
      room.on('stream', async stream => {
        const newVideo = document.createElement('video');
        newVideo.srcObject = stream;
        newVideo.playsInline = true;
        // mark peerId to find it later at peerLeave event
        newVideo.setAttribute('data-peer-id', stream.peerId);
        remoteVideos.append(newVideo);
        await newVideo.play().catch(console.error);
      });

      //他の参加者が部屋を離れた時
      room.on('peerLeave', peerId => {
        const remoteVideo = remoteVideos.querySelector(
          `[data-peer-id="${peerId}"]`
        );
        remoteVideo.srcObject.getTracks().forEach(track => track.stop());
        remoteVideo.srcObject = null;
        remoteVideo.remove();
      });
    }

    window.addEventListener('beforeunload', function () {
      localStorage.clear();
    });

  });
  //エラー処理
  peer.on('error', console.error);

  //ハート
  for (let i = 0; i < NUM_OF_HEARTS; i++) {
    heart.push(new Hearts());
  }
  //花火
  for (let i = 0; i < NUM_OF_FIRE; i++) {
    fw.push(new Fire());
  }
  //桜
  for (let i = 0; i < sakuraNum; i++) {
    fubuki.push(new Sakura());
  }
  //桜カラー配列
  clr.push(color(244, 191, 252, 150));
  clr.push(color(255, 219, 248, 150));
  clr.push(color(246, 204, 252, 150));

  //音符
  mus = [One_Red, One_White, One_Blue, One_Green, One_Yellow, Two_Red, Two_White, Two_Green, Two_Blue, Two_Yellow];
  pointinit();
  for (var i = 0; i < count; i++) {
    dots[i].initMe();
  }
  //炎
  for (let i = 0; i < width; i = i + 100) {
    system.push(new ParticleSystem(createVector(i, 180)));
  }

  //モデル読み込み
  model = await tf.loadLayersModel(MODEL_URL);
}

/////////////////////////////////////ループ//////////////////////////////////////////
function draw() {
  Canvas.clear();
  Canvas.background("rgba(0, 0, 0, 0.2)");
  lay.background(200);

  effect.clear();

  //サイズ変更
  if (!roomFlag) {
    //座標をスタックに保存
    push();
    if (isFlipped) {
      translate(width, 0); //表示ウィンドウ内の移動する量translate(x,y)移動 ループが再び始まると変換はリセット
      scale(-1, 1);//頂点を拡大及び縮小 scale(x,y)⇒反転している？
    }
    displayWidth = width;
    displayHeight = (width * lay.height) / lay.width;
    //前の座標を復元(pop以降の設定項目リセット)
    pop();
  }
  else {
    push();
    displayWidth = layer01.clientWidth;
    displayHeight = (layer01.clientWidth * 9) / 16
    pop();
    lay.resizeCanvas(displayWidth, displayHeight);
  }

  //他の人と反応が被った時のエフェクト
  if (enjoy_flag == 7) {
    effect.push();
    effect.background(255, 255, 255, random(100))
    effect.rect(0, 0, windowWidth, windowHeight);
    effect.pop();
  }

  drawHands();
  //キャンバスのストリーム(相手に送信する用)
  myStream = lay.elt.captureStream(frameRate());

}

//ハンドジェスチャ認識
function hand_pose(landmark) {
  const example = tf.tidy(() => {
    const ex = tf.tensor(landmark, [1, 63]);
    const prediction = model.predict(ex);

    result = maxIndex(prediction.dataSync());

    return result;

  })
  return result;
}

//最大値のインデックスを取る関数
function maxIndex(a) {
  return a.indexOf(Math.max(...a));
}

//ランドマーク取得
function landmark_get(landmark) {
  let handpose_sotai = [];
  let handpose_one = [];
  let handpose_list = [];

  //取得したランドマーク保存
  for (var i = 0; i < 21; i++) {
    landmark.push([int(keypointsHand[0][i].x * Canvas.width), int(keypointsHand[0][i].y * Canvas.height), keypointsHand[0][i].z]);
  }
  //相対座標に変換
  for (var i = 0; i < 21; i++) {
    var x = landmark[i][0] - landmark[0][0];
    var y = landmark[i][1] - landmark[0][1];
    var z = landmark[i][2] - landmark[0][2];
    handpose_sotai.push([x, y, z]);
  }
  //一次元配列に変換
  handpose_one = handpose_sotai.reduce((acc, elem) => {
    return acc.concat(elem)
  })
  //絶対値に変換
  let abs_handpose = [];
  for (var i = 0; i < handpose_one.length; i++) {
    abs_handpose.push(Math.abs(handpose_one[i]));
  }
  //配列の最大値を探す
  var max_value = Math.max.apply(null, abs_handpose);
  //正規化
  for (var i = 0; i < handpose_one.length; i++) {
    handpose_list.push(handpose_one[i] / max_value);
  }
  return handpose_list;
}

//----------------------------------------------------------------------------------------------------------------------------------------//
function drawHands() {

  //手を検出しなかった時リターンする
  if (keypointsHand.length == 0) {
    if (enjoy_id !== poseNUM*2 && room !== undefined) {
      enjoy_id = poseNUM*2;
      room.send(String(enjoy_id));
      localStorage.setItem(peer.id, enjoy_id)
    }
  }
  //片手だけの動作
  if (keypointsHand.length == 1) {

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
    /*
      //パーにしている時
      //光る円(ペンライト)
      if (flag_one.thumb == true && flag_one.index == true && flag_one.middle == true && flag_one.ring == true && flag_one.pinky == true) {

        lay.clear();

        //拍手した時
        if (palmarea.wt > 0.18) {
          penlight(tip.index, displayWidth, displayHeight);
        }
        if (palmarea.wt < 0.10) {
          if (frameCount % 7 == 0 || frameCount % 7 == 1 || frameCount % 7 == 2) {

            lay.push();
            lay.rotate(PI / 4);
            lay.translate(displayWidth / 3, -displayHeight * 4 / 3);
            efCurve(random() * (displayWidth / 2), random() * (displayHeight / 2), random() * (100 - 40) + 40, random() * (40 - 10) + 10, 5);
            //efThree(random()*(displayWidth/2),random()*(displayHeight/2), random()*(100-40)+40, random()*(40-20)+20);
            lay.pop()

            lay.push()
            lay.rotate(5 * PI / 4);
            lay.translate(-(displayWidth * 3 / 4), -displayHeight * 3 / 4);
            efCurve(random() * (displayWidth / 2), random() * (displayHeight / 2), random() * (100 - 40) + 40, random() * (40 - 10) + 10, 5);
            //efThree(random()*(displayWidth/2),random()*(displayHeight/2), random()*(100-40)+40, random()*(40-20)+20);
            lay.pop();

            lay.push();
            lay.image(
              clapImage,
              random() * displayWidth,
              random() * displayHeight,
              imagePNG.width * 0.10,
              imagePNG.height * 0.10
            );
            lay.pop();
          }
        }   
         
    }
    */
    let handpose = [];
    let handpose_result = [];

    //認識のid取得
    handpose_result = landmark_get(handpose);
    id = hand_pose(handpose_result);

    //パーの時
    if (id == 0 || id == poseNUM) {
      lay.clear();
      penlight(tip.index, displayWidth, displayHeight);
    }
    //グーの時
    else if (id == 1 || id == 1+poseNUM) {
      lay.clear();
      for (let i = 0; i < sakuraNum; i++) {
        fubuki[i].draw();
        fubuki[i].move();
      }
    }
    //ピースの時
    else if (id == 2 || id == 2+poseNUM) {
      lay.clear();
      Star(random() * lay.width, random() * lay.height, random() * 7);
    }
    //メロイックサインの時
    else if (id == 3 || id == 3+poseNUM) {
      lay.clear();
      for (var i = 0; i < count; i++) {
        dots[i].drawMe();
        dots[i].updateMe();
      }
    }
    //いいね
    else if (id == 4 || id == 4+poseNUM) {
      lay.clear();
      for (let f of fw) {
        f.run();
      }
    }
    //ブーイング
    else if (id == 5 || id == 5+poseNUM) {
      lay.clear();
      for (let i = 0; i < system.length; i++) {
        system[i].addParticle();
        system[i].run();
      }
    }
    //ハート
    else if (id == 6 || id == 6+poseNUM) {
      lay.clear();
      for (let b of heart) {
        b.move();
        b.show();
      }
    }
    //きゅんです
    else if (id == 7 || id == 7+poseNUM) {
      lay.clear();
      const size = dist(tip.thumb.x, tip.thumb.y, tip.index.x, tip.index.y);
      mini_heart(keypointsHand[0][6].x * displayWidth, keypointsHand[0][6].y * displayHeight, size * displayWidth);
    }
    //それ以外の処理
    else {
    }
    //部屋が立てられていて異なった動きをした時
    //どの動きをしているか登録
    if (id !== enjoy_id && room !== undefined) {
      enjoy_id = id;
      room.send(String(enjoy_id));
      localStorage.setItem(peer.id, enjoy_id)
    }

  }

}

//---------------------------------------------------------------------------------------------------------------------------------------//
//ダイヤ描画
function drawTwinkle(x, y, r) {
  lay.push();
  lay.translate(x, y);

  lay.beginShape();
  for (let theta = 0; theta < 360; theta++) {
    lay.vertex(r * pow(cos(theta), 3), r * 1.4 * pow(sin(theta), 3));
  }
  lay.endShape(CLOSE)
  lay.pop();
}
//効果線-曲線
function efCurve(x0, y0, w, h, a) {

  lay.push();

  lay.noFill();
  lay.strokeWeight(3);
  lay.stroke(255);

  lay.bezier(x0, y0 + h, x0 + a, y0 + h, x0 + w / 3, y0 + h / 5 + a, x0 + w / 3, y0 + h / 5);
  lay.bezier(x0 + w / 3, y0 + h / 5, x0 + w / 3 + a, y0 + h / 5 + a, x0 + w * 2 / 3 - a, y0 + h / 5 + a, x0 + w * 2 / 3, y0 + h / 5);
  lay.bezier(x0 + w * 2 / 3, y0 + h / 5, x0 + w * 2 / 3, y0 + h / 5 + a, x0 + w - a, y0 + h, x0 + w, y0 + h);

  lay.pop();
}
//効果線-直線
function efThree(x0, y0, w, h) {

  lay.push();

  lay.noFill();
  lay.strokeWeight(3);
  lay.stroke(255);

  lay.line(x0, y0 + h / 2, x0 + w / 4, y0 + h);
  lay.line(x0 + w / 2, y0, x0 + w / 2, y0 + h);
  lay.line(x0 + w, y0 + h / 2, x0 + 3 * w / 4, y0 + h);

  lay.pop();
}

//キラキラさせる
function Star(x, y, r) {
  lay.push();

  lay.drawingContext.shadowBlur = 30;
  lay.drawingContext.shadowColor = color(255, 255, random(255));

  lay.strokeWeight(1);
  lay.stroke(255);
  drawTwinkle(x, y, r);
  lay.pop();

}

//ペンライトの動き
function penlight(position, w, h) {
  lay.push();
  lay.fill(0, 20);
  lay.rect(0, 0, w, h);
  lay.drawingContext.shadowBlur = 30;
  lay.drawingContext.shadowColor = color(r, g, b)
  lay.noStroke();
  lay.fill(255);
  lay.ellipse(position.x * w, position.y * h, 10);
  lay.pop();
}

function penlight_remain(position) {
  lay.push();
  let T, A, R;
  //drawingContext.shadowBlur = 25;
  //drawingContext.shadowColor= color(r, g, b)
  //fill(255);
  t += .001
  lay.colorMode(HSB);
  lay.blendMode(BLEND);
  lay.background(0, .1);
  lay.noStroke();
  lay.blendMode(ADD);
  for (let a = 0; a < 3; a += .005) {
    lay.fill(a * 60, g, b, T = tan(a * 4 + t * 9) / 2);
    lay.circle(cos(R = a * a - t) * 360 * sin(A = a + t * 3 + sin(R + t)) + 360, sin(R) * 360 * cos(A) + 360, 4 / T);
  }
  lay.pop();
}

function mini_heart(x, y, size) {
  lay.push();
  lay.drawingContext.shadowBlur = 30;
  lay.drawingContext.shadowColor = "#FFAFD7";
  lay.fill(255, 105, 180);
  lay.noStroke();
  lay.beginShape();
  lay.vertex(x, y);
  lay.bezierVertex(x - size / 2, y - size / 2, x - size, y + size / 3, x, y + size);
  lay.bezierVertex(x + size, y + size / 3, x + size / 2, y - size / 2, x, y);
  lay.endShape(CLOSE);
  lay.pop();
}

//ハート作成
class Hearts {
  constructor() {
    this.x = random(displayWidth);
    this.y = displayHeight;
    this.speedY = random(-3, -1);
  }

  move() {
    this.x += random(-5, 5);
    this.y += this.speedY;

    if (this.isOffScreen()) {
      this.x = random(displayWidth);
      this.y = displayHeight;
      this.speedY = random(-3, -1);
    }
  }

  show() {
    lay.push();
    lay.imageMode(CENTER);
    //tint(255,100);
    lay.image(
      imagePNG,
      this.x,
      this.y,
      imagePNG.width * 0.03,
      imagePNG.height * 0.03
    );
    lay.pop();
  }

  isOffScreen() {
    return this.y < 0;
  }
}

//花火
class Fire {
  constructor() {
    this.p1 = 0
    this.p2 = 0
    this.lifeSpan = 100;
    this.ang = random(10);
    this.aStep = random(-1, 1) * 0.001;
    this.sets();
  }

  show() {
    lay.push();
    lay.drawingContext.shadowBlur = 20;
    lay.drawingContext.shadowColor = this.col;
    lay.translate(this.x, this.y);
    lay.rotate(this.ang);
    lay.stroke(this.col);
    for (let i = 0; i < this.num; i++) {
      lay.rotate(TAU / this.num);
      lay.stroke(this.col);
      lay.strokeWeight(2);
      lay.line(this.p1, 0, this.p2, 0);
      lay.stroke(255);
      lay.strokeWeight(1);
      lay.line(this.p1, 0, this.p2, 0);
    }
    lay.pop();
  }

  move() {
    this.life--;

    if (this.lifeSpan > this.life && this.life > 0) {
      let nrm = lay.norm(this.life, this.lifeSpan, 1);
      this.p1 = lay.lerp(0, this.s / 2, nrm ** 0.8);
      this.p2 = lay.lerp(0, this.s / 2, nrm ** 2);
      this.y += 0.5;
      this.ang += this.aStep;
    }
    if (this.life == 0) {
      this.sets();
    }
  }

  sets() {
    this.life = this.lifeSpan + int(random(100));
    this.num = int(random(8, 20));
    this.x = random(-0.1, 1.1) * displayWidth;
    this.y = random(-0.1, 1.1) * displayHeight;
    this.s = random(120, 250);
    this.col = random(colors);
  }

  run() {
    if (this.life < this.lifeSpan) this.show();
    this.move();
  }
}

//桜
class Sakura {
  constructor() {
    var n = 4;
    var A, md, r, R, x, y;

    this.xDef = random(displayWidth);

    this.xAmp = random(50, 100);
    this.xSpeed = random(1, 2);
    this.xTheta = random(360);

    this.ox = this.xDef + this.xAmp * sin(radians(this.xTheta));
    this.oy = random(displayHeight);
    this.rotateT = random(360);
    this.size = random(10, 30);

    this.ySpeed = this.size / 20;
    this.sizeYScale = 1;
    this.sizeYT = random(360);
    this.sizeYSpeed = this.size / 30;
    this.c = floor(random(3));

    this.draw = function () {
      lay.fill(clr[this.c]);

      lay.push();
      lay.noStroke();
      lay.translate(this.ox, this.oy);
      lay.rotate(radians(this.rotateT));
      lay.beginShape();
      for (var t = 0; t < 360 / 4; t++) {
        A = n / PI * radians(t);

        md = floor(A) % 2;

        r = pow(-1, md) * (A - floor(A)) + md;

        R = r + 2 * calcH(r);

        x = this.size * R * cos(radians(t));
        y = this.size * this.sizeYScale * R * sin(radians(t));

        lay.vertex(x, y);
      }
      lay.endShape(CLOSE);
      lay.pop();
    };

    this.move = function () {
      this.ox = this.xDef + this.xAmp * sin(radians(this.xTheta));
      this.xTheta += this.xSpeed;

      this.oy += this.ySpeed;
      this.sizeYT += this.sizeYSpeed;
      this.sizeYScale = abs(sin(radians(this.sizeYT)));

      if (this.oy > displayHeight + this.size) {
        this.oy = -this.size;
      }
    };
  }
}
function calcH(x) {
  if (x < 0.8) {
    return 0;
  }
  else {
    return 0.8 - x;
  }
}

//音符
function pointinit() {
  for (var i = 0; i < count; i++) {
    dots[i] = new ShowObj();
  }
}
function ShowObj() {
  var x, y;
  var sizeScale;
  var rotAngle;
  var rotSpeed;
  var speed, xnoise;
  var imgCol;
}
ShowObj.prototype.initMe = function () {
  this.x = random(0, displayWidth);
  this.y = random(0, displayHeight);
  this.imgCol = floor(random(0, 10));
  this.sizeScale = random(0.01, 0.05);
  this.rotAngle = 0;
  this.rotSpeed = random(-3, 3);
  this.speed = random(0.5, 2);
  this.xnoise = random(100);
}
ShowObj.prototype.updateMe = function () {
  this.x = this.x + noise(this.xnoise) * 2 - 1;
  this.xnoise = this.xnoise + noiseval;
  this.y = this.y + this.speed;
  if (this.y > displayHeight + 100) {
    this.initMe();
    this.y = -100;
  }
  this.rotAngle += this.rotSpeed;
}
ShowObj.prototype.drawMe = function () {
  lay.push();
  lay.translate(this.x, this.y);
  lay.rotate(radians(this.rotAngle));
  lay.scale(this.sizeScale, this.sizeScale);
  //tint(255, 30);
  lay.image(mus[this.imgCol], -(mus[this.imgCol].width / 2), -(mus[this.imgCol].height / 2));
  lay.pop();
}

//炎
class Particle {
  constructor(position) {
    //加速
    this.acceleration = createVector(0, -0.65);
    this.velocity = createVector(random(-0.3, 0.3), random(-0.3, 0.1));
    this.position = position.copy();
    //薄さ
    this.lifespan = 155;
    this.green = 220;
    this.size = 90;
  }
  run() {
    this.update();
    this.display();
  }
  // Method to update position
  update() {
    this.velocity.add(this.acceleration);
    this.position.add(this.velocity);
    this.lifespan -= 5;
    this.green -= 4;
    this.size -= 3;
  }
  // Method to display
  display() {
    lay.push();
    lay.drawingContext.shadowBlur = 45;
    lay.drawingContext.shadowColor = color(255, this.green, 20);
    lay.stroke(255, this.green, 70, this.lifespan);
    lay.strokeWeight(1);
    lay.fill(255, this.green, 70, this.lifespan);
    lay.ellipse(this.position.x, this.position.y, this.size, this.size);
    lay.pop();
  }
  // Is the particle still useful?
  isDead() {
    return this.lifespan < 0;
  }
  leadDead() {
    return this.size < 0;
  }
}

class ParticleSystem {
  constructor(position) {
    this.origin = position.copy();
    this.particles = [];
  }
  addParticle() {
    this.particles.push(new Particle(this.origin));
  }
  run() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      let p = this.particles[i];
      p.run();
      if (p.isDead()) {
        this.particles.splice(i, 1);
      }
      if (p.leadDead()) {
        this.particles.splice(i, 1);
      }
    }
  }
}
