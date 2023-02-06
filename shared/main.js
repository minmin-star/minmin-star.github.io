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
  setTimeout(function () {
    $('.loader-bg').fadeOut(700);
  }, 10000);
});

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
let poseNUM = 10;

//盛り上がりのフラッグ
let enjoy_flag = poseNUM;
let enjoy_id = poseNUM;

//モデル
let model_right;
const RIGHT_URL = './model_right/model.json';
let model_left;
const LEFT_URL = './model_left/model.json';
let id;

let history;
const HISTORY_URL = "./history/model.json";
let history_id;

//配列宣言
let handpose_one = [];

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


//手の関節位置
let keypointsHand = [];
let handness = [];
const isFlipped = true;

//ハート
var heart = [];
var heart_enjoy = [];
var NUM_OF_HEARTS = 7;

//花火
let fw = [];
let colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff', '#ffffff'];
var NUM_OF_FIRE = 8;

//クラッカー
var cl = [];
var cluckNumber = 70;


//桜
var sakuraNum = 40;
var fubuki = [];
var fubuki_enjoy = [];
var clr = [];

//バブル
var NUM_OF_BUBBLES = 20;
var MIN_SIZE = 4;
var MAX_SIZE = 12;
var bubbles = [];
var bubbles_enjoy = []; 
var clrs = [
  [255, 0, 255],
  [255, 255, 0],
  [0, 255, 255],
  [144, 255, 59]
];


//音符
var mus = [];
var dots = [];
var count = 15;
var noiseval = 0.01;

class Queue {
  constructor() {
    this.items = [];
  }
  //いれる
  enqueue(element) {
    return this.items.push(element);
  }
  //出す
  dequeue() {
    if (this.items.length > 0) {
      return this.items.shift();
    }
  }
  //さいず
  size() {
    return this.items.length;
  }
}
let queue = new Queue();

//ランドマーク検出
function onHandsResults(results) {
  keypointsHand = results.multiHandLandmarks;
  handness = results.multiHandedness;
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
let imagePNG, imageHeart;
let One_Blue, One_Green, Two_Red, Two_White, Two_Yellow;

let t = 0;

//画像読み込み先
function preload() {
  imagePNG = loadImage("../heart.png");
  imageHeart = loadImage("../img/heart.png")

  One_Blue = loadImage("../note/one_blue.png");
  One_Green = loadImage("../note/one_green.png");
  Two_Red = loadImage("../note/two_red.png");
  Two_White = loadImage("../note/two_white.png");
  Two_Yellow = loadImage("../note/two_yellow.png");
}
//setup
async function setup() {

  Canvas = createCanvas(320, 180);
  Canvas.parent(cav);
  Canvas.style("display", "none");

  //映像
  lay = createGraphics(320, 180);
  lay.parent(layer01);
  lay.style("display", "");
  lay.id('mylayer');

  //盛り上がりエフェクト
  effect = createGraphics(windowWidth, windowHeight);
  effect.parent(layer_enjoy);
  effect.style("display", "");

  peer = (window.peer = new Peer({
    key: window.__SKYWAY_KEY__,
    debug: 3,
  }));

  navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
    localVideo.srcObject = stream;
    localVideo.onloadedmetadata = function (e) {
      localVideo.play();

      myStream = lay.elt.captureStream(30);
    };
  })
    .catch(function (err) {
      console.log(err.name + ": " + err.message);
    });
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
      comment.textContent = yourName.value + "  hello! You're??"
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

    roomFlag = true;
    //参加者の場合
    if (user.item(0).checked == true) {

      //出力
      const camera = new Camera(localVideo, {
        onFrame: async () => {
          await hands.send({ image: localVideo });
        },
        width: 320,
        height: 180,
      });
      camera.start();

      room = peer.joinRoom(roomId.value, {
        mode: 'sfu',
        stream: myStream,
      });

      //映像画面に遷移
      roomIn.style.display = "none";
      roomJoin.style.display = "block";
      //ハート
      for (let i = 0; i < NUM_OF_HEARTS; i++) {
        heart.push(new Hearts(layer01.clientWidth, layer01.clientHeight));
      }
      for (let i = 0; i < NUM_OF_HEARTS; i++) {
        heart_enjoy.push(new Hearts(layer_enjoy.clientWidth, layer_enjoy.clientHeight));
      }
      //花火
      for (let i = 0; i < NUM_OF_FIRE; i++) {
        fw.push(new Fire(layer01.clientWidth, layer01.clientHeight));
      }
      //桜
      for (let i = 0; i < sakuraNum; i++) {
        fubuki.push(new Sakura(layer01.clientWidth, layer01.clientHeight));
      }
      for (let i = 0; i < sakuraNum; i++) {
        fubuki_enjoy.push(new Sakura(layer_enjoy.clientWidth, layer_enjoy.clientHeight));
      }

      // バブル
      for (let i = 0; i < NUM_OF_BUBBLES; i++) {
        bubbles.push(new Bubble(layer01.clientWidth, layer01.clientHeight));
      }
      for (let i = 0; i < NUM_OF_BUBBLES; i++) {
        bubbles_enjoy.push(new Bubble(layer_enjoy.clientWidth, layer_enjoy.clientHeight));
      }

      //他のユーザから送信されたデータを受信した時
      room.on("data", ({ src, data }) => {
        localStorage.setItem(src, data);

        if (localStorage.length > 0) {
          let c = Array(poseNUM + 1);
          c.fill(0);
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const num = localStorage.getItem(key);
            if (parseInt(num) !== poseNUM) {
              const n = parseInt(num) % poseNUM;
              c[n] += 1
            }
            else {
              enjoy_flag = 10;
            }
          }
          if (Math.max(...c) >= 3) {
            enjoy_flag = maxIndex(c);
          }
        }
      });

      //他の参加者のストリームを検出した時
      room.on('stream', async stream => {
        const newVideo = document.createElement('video');
        newVideo.srcObject = stream;
        newVideo.playsInline = true;
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

      const room = peer.joinRoom(roomId.value, {
        mode: 'sfu',
      });

      //映像画面に遷移
      roomIn.style.display = "none";
      roomJoin.style.display = "block";
      //ハート
      for (let i = 0; i < NUM_OF_HEARTS; i++) {
        heart_enjoy.push(new Hearts(layer_enjoy.clientWidth, layer_enjoy.clientHeight));
      }
      //桜
      for (let i = 0; i < sakuraNum; i++) {
        fubuki_enjoy.push(new Sakura(layer_enjoy.clientWidth, layer_enjoy.clientHeight));
      }
      // バブル
      for (let i = 0; i < NUM_OF_BUBBLES; i++) {
        bubbles_enjoy.push(new Bubble(layer_enjoy.clientWidth, layer_enjoy.clientHeight));
      }

      //他のユーザから送信されたデータを受信した時
      room.on("data", ({ src, data }) => {
        localStorage.setItem(src, data);

        if (localStorage.length > 0) {
          let c = Array(poseNUM + 1);
          c.fill(0);
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const num = localStorage.getItem(key);
            if (parseInt(num) !== poseNUM) {
              const n = parseInt(num) % poseNUM;
              c[n] += 1
            }
            else {
              enjoy_flag = 10;
            }
          }
          if (Math.max(...c) >= 3) {
            enjoy_flag = maxIndex(c);
          }
        }
      });
      //他の参加者が参加してきたとき
      room.on('stream', async stream => {
        const newVideo = document.createElement('video');
        newVideo.srcObject = stream;
        newVideo.playsInline = true;
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


  clr.push(color(244, 191, 252, 150));
  clr.push(color(255, 219, 248, 150));
  clr.push(color(246, 204, 252, 150));
  //音符
  mus = [One_Blue, One_Green, Two_Red, Two_White, Two_Yellow];
  pointinit();
  for (var i = 0; i < count; i++) {
    dots[i].initMe();
  }

  //モデル読み込み
  model_right = await tf.loadLayersModel(RIGHT_URL);
  model_left = await tf.loadLayersModel(LEFT_URL);
  history = await tf.loadLayersModel(HISTORY_URL);

}

//draw
function draw() {
  effect.clear();

  //サイズ変更
  if (!roomFlag) {
    push();
    if (isFlipped) {
      translate(width, 0);
      scale(-1, 1);
    }
    displayWidth = width;
    displayHeight = (width * lay.height) / lay.width;
    pop();
  }
  else {
    push();
    displayWidth = layer01.clientWidth;
    displayHeight = (layer01.clientWidth * 9) / 16
    pop();
    lay.resizeCanvas(displayWidth, displayHeight);
  }

  if (user.item(0).checked == true) {
    drawHands();
  }

  //他の人と反応が被った時のエフェクト
  if (enjoy_flag == 0) {
    for (let i = 0; i < sakuraNum; i++) {
      fubuki_enjoy[i].draw2();
      fubuki_enjoy[i].move(layer_enjoy.clientHeight);
    }
  }
  else if (enjoy_flag == 1) {
    effect.push();
      effect.fill(255, 255, 255, random(50))
      effect.rect(0, 0, layer_enjoy.clientWidth, layer_enjoy.clientHeight);
    effect.pop();
  }
  else if (enjoy_flag == 2) {
    effect.push();
    effect.drawingContext.shadowBlur = 30;
    effect.drawingContext.shadowColor = color(255, 255, random(255));
    effect.fill(255);
    effect.ellipse( random(layer_enjoy.clientWidth), random(layer_enjoy.clientHeight), 10 , 10);
    effect.pop();
  }
  else if (enjoy_flag == 4) {
    effect.push();
    for (let b of bubbles_enjoy) {
      b.move(layer_enjoy.clientHeight); // 上昇
      b.show2(); // 描画
    }
    effect.pop();
  }
  else if (enjoy_flag == 5) {
    effect.push();
      effect.fill(168, 110, 255, random(50))
      effect.rect(0, 0, layer_enjoy.clientWidth, layer_enjoy.clientHeight);
    effect.pop();
  }
  else if (enjoy_flag == 6) {
    effect.push();
      effect.fill(255, 49, 99, random(50))
      effect.rect(0, 0, layer_enjoy.clientWidth, layer_enjoy.clientHeight);
    effect.pop();
  }
  else if (enjoy_flag == 7) {
    effect.push();
    for (let b of heart_enjoy) {
      b.move(layer_enjoy.clientWidth, layer_enjoy.clientHeight);
      b.show2();
    }
    effect.pop();
  }
  //拍手
  else if (enjoy_flag == 8) {

  }


}

//ハンドポーズ認識
function hand_pose(landmark, model) {
  let result;
  const example = tf.tidy(() => {
    const ex = tf.tensor(landmark, [1, 63]);
    const prediction = model.predict(ex);

    result = maxIndex(prediction.dataSync());

    return result;

  })
  return result;
}

//ハンドジェスチャ認識
function hand_gesture(landmark) {
  let result;
  const example = tf.tidy(() => {
    const ex = tf.tensor(landmark, [1, 48])
    const prediction = history.predict(ex);

    result = maxIndex(prediction.dataSync());

    return result;
  })
  return result;
}

function maxIndex(a) {
  return a.indexOf(Math.max(...a));
}

//ランドマーク取得
function landmark_get() {
  let hand = [];

  //相対座標に変換
  for (var i = 0; i < 21; i++) {
    var x = (keypointsHand[0][i].x - keypointsHand[0][0].x) * displayWidth;
    var y = (keypointsHand[0][i].y - keypointsHand[0][0].y) * displayHeight;
    var z = keypointsHand[0][i].z - keypointsHand[0][0].z;
    hand.push([x, y, z]);
  }
  //一次元配列に変換
  handpose_one = hand.reduce((acc, elem) => {
    return acc.concat(elem)
  })
  hand.length = 0;
  //絶対値に変換
  let abs_handpose = [];
  for (var i = 0; i < handpose_one.length; i++) {
    abs_handpose.push(Math.abs(handpose_one[i]));
  }
  //配列の最大値を探す
  var max_value = Math.max.apply(null, abs_handpose);
  //正規化
  for (var i = 0; i < handpose_one.length; i++) {
    hand.push(handpose_one[i] / max_value);
  }
  hand_pose.lenth = 0;
  return hand;
}

//座標取得
function history_get(point) {
  if (16 <= queue.size()) {
    queue.dequeue();
    queue.enqueue(point);

    let newpoint = [];

    for (let i = 0; i < queue.size(); i++) {
      var x = (queue.items[i].x - queue.items[0].x) / displayWidth;
      var y = (queue.items[i].y - queue.items[0].y) / displayHeight;
      var z = queue.items[i].z - queue.items[0].z;
      newpoint.push([x, y, z]);
    }
    let onepoint = [];

    onepoint = newpoint.reduce((acc, elem) => {
      return acc.concat(elem)
    })

    return onepoint;

  }
  else {
    queue.enqueue(point);
    return queue;
  }
}

//----------------------------------------------------------------------------------------------------------------------------------------//
function drawHands() {

  if (keypointsHand.length == 0) {
    lay.clear();
    if (enjoy_id !== poseNUM && room !== undefined) {
      enjoy_id = poseNUM;
      room.send(String(enjoy_id));
      localStorage.setItem(peer.id, enjoy_id)
    }
  }
  //片手だけの動作
  else if (keypointsHand.length == 1) {

    //指先の配列
    const tip = {
      thumb: keypointsHand[0][4],
      index: keypointsHand[0][8],
      middle: keypointsHand[0][12],
      ring: keypointsHand[0][16],
      pinky: keypointsHand[0][20],
    };

    let handpose_result = [];
    handpose_result = landmark_get();
    //認識のid取得
    if ((handness[0].label).indexOf("Right") == 0) {
      id = hand_pose(handpose_result, model_right);
    }
    else {
      id = hand_pose(handpose_result, model_left)
    }
    //パーの時
    if (id == 0) {
      lay.clear();
      let history_result = [];
      history_result = history_get(keypointsHand[0][8]);
      if (history_result.length == 16 * 3) {
        history_id = hand_gesture(history_result);

        console.log(history_id);
        if (history_id == 0) {
          for (let i = 0; i < sakuraNum; i++) {
            fubuki[i].draw();
            fubuki[i].move(displayHeight);
          }
        }
        else if (history_id == 1) {
          lay.push();
          lay.fill(255, 255, 255, random(100))
          lay.rect(0, 0, windowWidth, windowHeight);
          lay.pop();
        }
        else {

        }
      }
    }
    //グーの時
    else if (id == 1) {
      lay.clear();
      for (let f of fw) {
        f.run(displayWidth, displayHeight);
      }
    }
    //ピースの時
    else if (id == 2) {
      lay.clear();
      Star(random() * displayWidth, random() * displayHeight, random() * 6);
    }
    //メロイックサインの時
    else if (id == 3) {
      lay.clear();
      for (var i = 0; i < count; i++) {
        dots[i].drawMe();
        dots[i].updateMe();
      }
    }
    //いいね
    else if (id == 4) {
      lay.clear();
      for (let b of bubbles) {
        b.move(displayHeight); // 上昇
        b.show(); // 描画
      }
    }
    //ブーイング
    else if (id == 5) {
      lay.clear();
    }
    //ハート
    else if (id == 6) {
      lay.clear();
      for (let b of heart) {
        b.move(displayWidth, displayHeight);
        b.show();
      }
    }
    //きゅんです
    else if (id == 7) {
      lay.clear();
      const size = dist(tip.thumb.x, tip.thumb.y, tip.index.x, tip.index.y);
      mini_heart(keypointsHand[0][6].x * displayWidth, keypointsHand[0][6].y * displayHeight, size * displayWidth);
    }
    //拍手
    else if (id == 8) {
      lay.clear();
      for (let i = 0; i < cl.length; i++) {
        let item = cl[i];
        item.time = item.time + 1;
        item.x = item.x + item.dx;
        item.y = item.y + item.dy;
        item.dx = item.dx * 0.99;
        item.dy = item.dy + 1;

        lay.push();
        lay.translate(item.x, item.y);
        let _rad = lay.radians(item.angle);
        lay.rotate(_rad);
        lay.fill(item.r, item.g, item.b);
        lay.noStroke();
        lay.rect(0, 0, 9 * cos(radians(item.time)), 9);
        lay.pop();
      }
      cluck_move(displayWidth, displayHeight);
    }
    //なぞる
    else if (id == 9) {
      penlight(tip.index, displayWidth, displayHeight);
    }
    //それ以外の処理
    else {
      lay.clear();
    }
    if (id !== enjoy_id && room !== undefined) {
      enjoy_id = id;
      room.send(String(enjoy_id));
      localStorage.setItem(peer.id, enjoy_id)
    }
  }
  else { }
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
  lay.fill(0, 0, 0, 30);
  lay.rect(0, 0, w, h);
  lay.drawingContext.shadowBlur = 40;
  lay.drawingContext.shadowColor = color(240, 240, 240)
  lay.noStroke();
  lay.fill(255);
  lay.ellipse(position.x * w, position.y * h, 15);
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
  constructor(w, h) {
    this.x = random(w);
    this.y = h;
    this.speedY = random(-3, -1);
  }

  move(w, h) {
    this.x += random(-5, 5);
    this.y += this.speedY;

    if (this.isOffScreen()) {
      this.x = random(w);
      this.y = h;
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
      imagePNG.width * 0.04,
      imagePNG.height * 0.04
    );
    lay.pop();
  }

  show2() {
    effect.push();
    effect.imageMode(CENTER);
    //tint(255,100);
    effect.image(
      imageHeart,
      this.x,
      this.y,
      imageHeart.width * 0.04,
      imageHeart.height * 0.04
    );
    effect.pop();
  }

  isOffScreen() {
    return this.y < 0;
  }
}

//花火
class Fire {
  constructor(w, h) {
    this.p1 = 0
    this.p2 = 0
    this.lifeSpan = 100;
    this.ang = random(10);
    this.aStep = random(-1, 1) * 0.001;
    this.sets(w, h);
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

  move(w, h) {
    this.life--;

    if (this.lifeSpan > this.life && this.life > 0) {
      let nrm = lay.norm(this.life, this.lifeSpan, 1);
      this.p1 = lay.lerp(0, this.s / 2, nrm ** 0.8);
      this.p2 = lay.lerp(0, this.s / 2, nrm ** 2);
      this.y += 0.5;
      this.ang += this.aStep;
    }
    if (this.life == 0) {
      this.sets(w, h);
    }
  }

  sets(w, h) {
    this.life = this.lifeSpan + int(random(100));
    this.num = int(random(8, 20));
    this.x = random(-0.1, 1.1) * w;
    this.y = random(-0.1, 1.1) * h;
    this.s = random(120, 250);
    this.col = random(colors);
  }

  run(w, h) {
    if (this.life < this.lifeSpan) this.show();
    this.move(w, h);
  }
}

//桜
class Sakura {
  constructor(w, h) {
    var n = 4;
    var A, md, r, R, x, y;

    this.xDef = random(w);

    this.xAmp = random(50, 100);
    this.xSpeed = random(1, 2);
    this.xTheta = random(360);

    this.ox = this.xDef + this.xAmp * sin(radians(this.xTheta));
    this.oy = random(h);
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

    this.draw2 = function(){
      effect.fill(clr[this.c]);

      effect.push();
      effect.noStroke();
      effect.translate(this.ox, this.oy);
      effect.rotate(radians(this.rotateT));
      effect.beginShape();
      for (var t = 0; t < 360 / 4; t++) {
        A = n / PI * radians(t);

        md = floor(A) % 2;

        r = pow(-1, md) * (A - floor(A)) + md;

        R = r + 2 * calcH(r);

        x = this.size * R * cos(radians(t));
        y = this.size * this.sizeYScale * R * sin(radians(t));

        effect.vertex(x, y);
      }
      effect.endShape(CLOSE);
      effect.pop();

    }

    this.move = function (h) {
      this.ox = this.xDef + this.xAmp * sin(radians(this.xTheta));
      this.xTheta += this.xSpeed;

      this.oy += this.ySpeed;
      this.sizeYT += this.sizeYSpeed;
      this.sizeYScale = abs(sin(radians(this.sizeYT)));

      if (this.oy > h + this.size) {
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
class ShowObj {
  constructor() {
  }
  initMe() {
    this.x = random(0, displayWidth);
    this.y = random(0, displayHeight);
    this.imgCol = floor(random(0, 4));
    this.sizeScale = random(0.01, 0.06);
    this.rotAngle = 0;
    this.rotSpeed = random(-3, 3);
    this.speed = random(0.5, 2);
    this.xnoise = random(100);
  }
  updateMe() {
    this.x = this.x + noise(this.xnoise) * 2 - 1;
    this.xnoise = this.xnoise + noiseval;
    this.y = this.y + this.speed;
    if (this.y > displayHeight + 100) {
      this.initMe();
      this.y = -100;
    }
    this.rotAngle += this.rotSpeed;
  }
  drawMe() {
    lay.push();
    lay.translate(this.x, this.y);
    lay.rotate(radians(this.rotAngle));
    lay.scale(this.sizeScale, this.sizeScale);
    //tint(255, 30);
    lay.image(mus[this.imgCol], -(mus[this.imgCol].width / 2), -(mus[this.imgCol].height / 2));
    lay.pop();
  }
}

//紙吹雪
class cluck {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.time = 0;
    this.r = random(100, 255);
    this.g = random(100, 255);
    this.b = random(100, 255);
    this.angle = random(0, 360);
    this.dx = random(-20, 0);
    this.dy = random(-30, 3);
  }
}
function cluck_move(x, y) {
  let item = new cluck;
  item.x = x;
  item.y = y;
  item.time = 0;
  item.r = random(100, 255);
  item.g = random(100, 255);
  item.b = random(100, 255);
  item.angle = random(0, 360);
  item.dx = random(-20, 0);
  item.dy = random(-30, 3);
  cl.push(item);
}


// バブルを表すクラス
class Bubble {
  constructor(w, h) {
    this.x = random(w); // x座標の位置はランダムにする
    this.y = h; // バブルの初期位置はキャンバスの一番下とする
    this.r = random(MIN_SIZE, MAX_SIZE); // バブルの半径
    this.c = clrs[floor(random(clrs.length))]; // バブルの色
    this.speedY = random(-2, -1); // 上昇する速度
    this.lightX = random([-1, 1]); // バブルに描画する光のx座標の位置
    this.lightY = random([-1, 1]); // バブルに描画する光のy座標の位置
  }

  // バブルを上昇させる
  move(h) {
    this.x += random(-1, 1); // バブルが微妙に左右に揺れるようにしている
    this.y += this.speedY; // バブルを上昇させる

    // バブルがキャンバスから見えなくなったら、
    // 位置をキャンバスの一番下に戻す。
    // 色や大きさなども変更する。
    if (this.isOffScreen()) {
      this.x = random(width);
      this.y = h;
      this.r = random(MIN_SIZE, MAX_SIZE);
      this.c = clrs[floor(random(clrs.length))];
      this.speedY = random(-2, -1);
      this.lightX = random([-1, 1]);
      this.lightY = random([-1, 1]);
    }
  }

  // バブルを描画
  show() {
    lay.push();
    lay.stroke(this.c[0], this.c[1], this.c[2]);
    lay.fill(this.c[0], this.c[1], this.c[2], floor(random(10, 50)));
    lay.ellipse(this.x, this.y, this.r * 2);
    lay.fill(255)

    let offsetX = this.lightX * this.r / 2;
    let offsetY = this.lightY * this.r / 2;
    lay.ellipse(this.x + offsetX, this.y + offsetY, this.r * 0.2);
    lay.pop();
  }
  
  show2(){
    effect.push();
    effect.stroke(this.c[0], this.c[1], this.c[2]);
    effect.fill(this.c[0], this.c[1], this.c[2], floor(random(10, 50)));
    effect.ellipse(this.x, this.y, this.r * 2);
    effect.fill(255)

    let offsetX = this.lightX * this.r / 2;
    let offsetY = this.lightY * this.r / 2;
    effect.ellipse(this.x + offsetX, this.y + offsetY, this.r * 0.2);
    effect.pop();

  }

  // バブルが一番上まで到達したかどうか判定
  isOffScreen() {
    return this.y < 0;
  }
}