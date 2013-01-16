
var framerate = 60;

var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
ctx.font = "12px Arial";
ctx.translate(0, 0);

var W = canvas.width, H = canvas.height;
var o = new Vector(W/2, H/2, 0);
var zero = new Vector(0,0,0);
var mouse = new Vector(0, 0, 0);
var mouseInit = new Vector();
var pause = false;
var s = 10;

var cam = new Vector(0, 0, 10);
var camL = new Vector(1,0,0);
var camU = new Vector(0,1,0);
var camD = new Vector(0,0,1);

var fov = 70;
var n = 0.1;
var far = 5;

camL = camL.unit();
camU = camU.unit();


var camAngle = 0;
var camAngleY = 0;

var poly = Array();
var gunOriginal = Array();
var gun = Array();
var zBuffer;

var perspectiveM = new Matrix();

var fOn = true;
var velocity = new Vector(0,0,0);
var jLock = false;

var loadingModel = 0;
var nbrModel = 0;
var vectex = Array();
var polygon = Array();

var tran = 0;
var is_up = false;
var tLock = false;
var timerT;


function loadModel( url, pArray, mult, cb){
    loadingModel++;
    nbrModel++;
  var mdFile = new XMLHttpRequest();
  mdFile.open("GET", url, true);
  mdFile.onreadystatechange = function() {
    if (mdFile.readyState === 4) {  
      if (mdFile.status === 200) {
        loadObj(mdFile.responseText, pArray, mult);
        loadingModel--;
        cb();
      }
    }
  };
  mdFile.send(null);
}



function loadObj( file, pArray, mult) {
    vectex = Array();
    polygon = Array();
    var g, fArray;
    file = file.split("\n");
    for(g = 0; g < file.length; g++){
      handleData(file[g]);
    }
            
     var v = Array();
     for(g = 0; g < vectex.length; g++){
         v[g] = new Vector( vectex[g][0]*mult, vectex[g][1]*mult, vectex[g][2]*mult);
     }
            
     for(g = 0; g < polygon.length; g++){
       fArray = Array();
       for(var p = 0; p < polygon[g].length; p++){
          fArray.push(v[polygon[g][p]]);
       }
       pArray.push(new Poly(fArray));
     }
}

function handleData( line){
  var lineA = line.split(" ");
  var t, p;
  line = Array();
  
  for(p = 0; p < lineA.length; p++){
    if(lineA[p] !== '')
      line.push(lineA[p]);
  }
  
  if(line[0] == 'v'){
    
      t = Array();
      t[0] = parseFloat(line[1]);
      t[1] = parseFloat(line[2]);
      t[2] = parseFloat(line[3]);
      
      vectex.push(t);
    }
  
  if(line[0] == 'f'){
    
      t = Array();
    
      for(p = 1; p < line.length; p++){
          t[p - 1] = parseFloat(line[p].split('/')[0]) - 1;
      }
      polygon.push(t);
    }
        
}

function Poly(vArray){
  this.P = Array();
  for(var q = 0; q < vArray.length; q++){
    this.P[q]= vArray[q];
  }
}

function add3V(va, vb, vc){
  var pa = Array();
  pa[0] = va;
  pa[1] = vb;
  pa[2] = vc;
  return new Poly(pa);
}
function addPoly(vArray, translate){
  var pa = Array();
  for(var q = 0; q < vArray.length; q++){
    pa[q]= vArray[q].add(translate);
  }
  
  poly.push(new Poly(pa));
  
}

function createCube( from, to){
      var w, h, k, arrayV = Array();
      w = new Vector(from.x - to.x,0,0);
      h = new Vector(0,from.y - to.y,0);
      k = new Vector(0,0,from.z - to.z);
  
  arrayV[0] = to.add(w);
  arrayV[1] = to.add(h).add(w);
  arrayV[2] = to.add(h);
  arrayV[3] = to;
  
  addPoly(arrayV, new Vector(0,0,0));
  addPoly(arrayV, k);
  
  arrayV[0] = to.add(w);
  arrayV[1] = to.add(w).add(k);
  arrayV[2] = to.add(k);
  arrayV[3] = to;
  
  addPoly(arrayV, new Vector(0,0,0));
  addPoly(arrayV, h);
  
  arrayV[0] = to.add(h);
  arrayV[1] = to.add(h).add(k);
  arrayV[2] = to.add(k);
  arrayV[3] = to;
  
  addPoly(arrayV, new Vector(0,0,0));
  addPoly(arrayV, w);
}

function createCylinder( from, r, length, n){
   var arrayV = Array();
   var arrayV2 = Array();
   var l = new Vector(0,length,0);
   
  for(var q = 0; q < n; q++){
      arrayV[q] = new Vector(
        Math.sin(2*Math.PI*q/n)*r,
        0,
        Math.cos(2*Math.PI*q/n)*r);
      arrayV[q] = arrayV[q].add(from);
    
      arrayV2[0] = arrayV[q];
      arrayV2[1] = new Vector(
        Math.sin(2*Math.PI*(q+1)/n)*r,
        0,
        Math.cos(2*Math.PI*(q+1)/n)*r);
      arrayV2[1] = arrayV2[1].add(from);
    
      arrayV2[2] = arrayV2[1].add(l);
      arrayV2[3] = arrayV2[0].add(l);
    
      addPoly(arrayV2, new Vector(0,0,0));
  }
  addPoly(arrayV, new Vector(0,0,0));
  addPoly(arrayV, l);
  
}

function vecRot(v, a){
  var x2, y2, z2, x3, y3, z3, x4, y4, z4;
  x2 = v.x * Math.cos(a.z) - v.y * Math.sin(a.z);  
  y2 = v.x * Math.sin(a.z) + v.y * Math.cos(a.z);
  z2 = v.z;
  
  x3 = x2 * Math.cos(a.x) - z2 * Math.sin(a.x);
  y3 = y2;
  z3 = x2 * Math.sin(a.x) + z2 * Math.cos(a.x);
  
  x4 = x3;
  y4 = y3 * Math.cos(a.y) - z3 * Math.sin(a.y);
  z4 = y3 * Math.sin(a.y) + z3 * Math.cos(a.y);
  
  return new Vector(x4, y4, z4);
}
function polyRot(po, angle){
  var pa = Array();
  for(var q = 0; q < po.P.length; q++){
    pa[q]= vecRot(po.P[q], angle);
  }
  
  return new Poly(pa);
}
function modelRot(m, angle){
  for(var q = 0; q < m.length; q++){
    m[q]= polyRot(m[q], angle);
  }
}
function modelTrans(m, t){
  for(var q = 0; q < m.length; q++){
    for(var j = 0; j < m[q].P.length; j++){
        m[q].P[j] = m[q].P[j].add(t);
    }
  }
}
function drawPoly(p, is_view){
  var V = Array();
  var Vz = Array();
  var drawed = true;
  
  for(var q = 0; q < p.P.length; q++){
    if(is_view)
        V[q] = doView(p.P[q]);
    else
        V[q] = p.P[q];
    Vz[q] = V[q].z;
    if(Vz[q] < 0) 
      drawed = false;
  }
  if(drawed){
    for(q = 0; q < V.length; q++){
      V[q] = perspectiveM.transformPoint(V[q]).multiply(50);
      V[q].z = Vz[q]*5;
    }
     var normal = (V[0].subtract(V[1])).cross(V[1].subtract(V[2]));
     var color = ((Math.asin(Math.abs(normal.z)/(normal.length())))/(Math.PI/2) * 200>>0 )+ 10;
     
    ctx.fillStyle = "rgb("+color+","+color+","+color+")";
    
    //console.log(color);
    
    ctx.beginPath();
      ctx.moveTo(V[0].x* W/400 + o.x, V[0].y* W/400 + o.y);
    
      for(q = 1; q < V.length; q++){
          ctx.lineTo(V[q].x* W/400 + o.x, V[q].y* W/400 + o.y);
      }
     ctx.closePath();
    
     if(fOn) 
       ctx.fill();
     else 
       ctx.stroke();
    
   //drawVector3f(v2.subtract(v1).multiply(0.5).subtract(v1.subtract(v3).multiply(0.5)).add(v1) , normal);
  }
}
function drawVector3f( g, d){
    ctx.beginPath();
    ctx.moveTo(o.x + g.x, o.y + g.y);
    ctx.lineTo(o.x + g.x + d.x, o.y + g.y + d.y);
    ctx.closePath();
    ctx.stroke();
}

function lengthToCam(cP, po){
  var re = 0;
  for(var q = 0; q < po.P.length; q++){
    re += po.P[q].subtract(cP).length();
  }
  return re / po.P.length;
}
function drawModel( pArray, is_view){
  zBuffer = Array();
  for(var q = 0; q < pArray.length; q++){
    if(is_view)
        zBuffer.push([q,lengthToCam(cam,pArray[q])]);
    else
        zBuffer.push([q,lengthToCam(zero,pArray[q])]);
  }
  
  zBuffer.sort(sorting);
  
  for(q = 0; q < zBuffer.length; q++){
    drawPoly(pArray[zBuffer[q][0]], is_view);
  }
}

function drawGod(){
  ctx.lineWidth = "2";
  ctx.strokeStyle = "green";
  drawVector3f(new Vector(W/2-50,30-H/2,0), camD.multiply(25).negative());
  
  ctx.strokeStyle = "black";
  drawVector3f(new Vector(W/2-50,30-H/2,0), camL.multiply(25));
  ctx.strokeStyle = "blue";
  drawVector3f(new Vector(W/2-50,30-H/2,0), camU.multiply(25).negative());
}

function draw(){
  
    ctx.fillStyle = "white"; 
      
    ctx.fillRect (0, 0, W, H);
    ctx.fillStyle = "blue";
      
    ctx.strokeStyle = "black";
    ctx.lineWidth = "1";
    ctx.fillStyle = "black";
  
  if(loadingModel === 0){
//        if(tran > 20)
//            is_up = true;
//        if(tran < -40)
//            is_up = false;
//        if(is_up){
//            tran --;
//            modelRot(gun, new Vector(0,Math.PI/256,0));
//        }
//        else{
//            tran ++;
//            modelRot(gun, new Vector(0,-Math.PI/256,0));
//        }
        
        drawModel(poly,true);
        drawModel(gun,false);
        //drawModel(gunOriginal,false);
  }
  else
     ctx.fillText("Model loading ["+(nbrModel-loadingModel)+"/"+nbrModel+"]", W/2-50, H/2);
  drawGod();
  
  if(pause) 
    drawPause();
  
    ctx.fillStyle = "black";
  ctx.fillText("Cam - x:"+cam.x+" y:"+cam.y+" z:"+cam.z, 4, H-10);
//  ctx.fillText("Cam("+cOn+") Pers("+pOn+")", 4, H-30);
  ctx.fillText("Velocity - x:"+velocity.x+" y:"+velocity.y+" z:"+velocity.z, 4, H-50);
  ctx.fillText("Mouse - x:"+mouse.x+" y:"+mouse.y, 4, H-70);
  ctx.fillText("S = "+s, 4,18);
  ctx.fillText("Polygons = "+poly.length, 4,32);
  ctx.fillText("T= "+tran, 4,46);
  ctx.fillText("xT= "+(new Date().getTime() - timerT)/1000, 4,66);
 // ctx.fillText("CamL - x:"+(((camL.x*1000)>>0)/1000)+" y:"+camL.y+" z:"+(((camL.z*1000)>>0)/1000), 4,40);
//  ctx.fillText("CamD - x:"+(((camD.x*1000)>>0)/1000)+" y:"+camD.y+" z:"+(((camD.z*1000)>>0)/1000), 4,60);
//  ctx.fillText("CamU - x:"+(((camU.x*1000)>>0)/1000)+" y:"+camU.y+" z:"+(((camU.z*1000)>>0)/1000), 4,80);
//    ctx.fillText("Dot: "+ camD.dot(camU.cross(camL)), 4,100);
 //   ctx.fillText("Angle: "+ Math.acos(camD.dot(camL)/(camD.length()*camL.length()))*180/Math.PI, 4,120);
  
  //cam.add(camD.multiply(s));
  
//  var dc = new Vector(Math.sin(camAngle) * Math.sin(camAngleY - Math.PI/2),Math.sin(camAngleY),Math.cos(camAngle) * Math.sin(camAngleY - Math.PI/2));

//  var lc = new Vector(Math.sin(camAngle - Math.PI/2),0,Math.cos(camAngle - Math.PI/2));
//  var uc = dc.cross(lc).unit().negative().multiply(100);
}

function bezierFunc(p2, p3, t) {
   var a = t;
   var b = 1 - t;
    var p4 = 1;
      
   return 3 * p2 * Math.pow(b, 2) * a + 3 * p3 * b * Math.pow(a, 2) + p4 * Math.pow(a, 3);
}
function update(){
  
  
    if(loadingModel === 0){
        gun = gunOriginal.slice(0);
        //var xT = 0.5;
        var xT = (new Date().getTime() - timerT)/500;
        if(is_up && !tLock){
           // tran = 1000/(new Date().getTime() - timerT);
            //tran = bezierFunc(0.5, 0.5, 1-xT);
            tran = bezierFunc(-0.55, 1.26, 1-xT);
            tran = bezierFunc(1, 1, 1-xT);
        }
        else if(!is_up && tLock){
            //tran = 1- 100/(new Date().getTime() - timerT);
            //tran = bezierFunc(0.5, 0.5, xT);.68,-0.55,.16,1.26
            tran = bezierFunc(-0.55, 1.26, xT);
            tran = bezierFunc(1, 1, xT);
        }
        if(xT >= 1 && tLock){
            tran = 1;
            is_up = true;
        }
        else if(xT >= 1 && !tLock){
            tran = 0;
            is_up = false;
        }
        //modelRot(gun, new Vector(Math.PI/2,Math.PI/200 * tran,0)); 
        modelRot(gun, new Vector(Math.PI/2,0,0)); 
        //new Vector(-0.1,-2.1,3) new Vector(-5,-5,10)
        //modelTrans(gun, new Vector(-0.1,-2.1,3));
        modelTrans(gun, new Vector(-0.1,-2.1,3).multiply(tran).add((new Vector(-5,-5,10)).multiply(1-tran)));
    }
  
  
  velocity.y -= 0.1;
  //cam = cam.add(velocity);
  if(cam.y < 0){
   // cam.y = 0;
    velocity.y = 0;
    jLock = false;
  }
  
  if(false){
    camAngle = 0;
    camAngleY = 0;
  }
  else{
    camAngle = mouseInit.subtract(mouse).x/W*6;
    camAngleY = mouseInit.subtract(mouse).y/H*3;
    if(camAngleY > Math.PI/2){
       camAngleY = Math.PI/2;
      mouse.y = mouseInit.y - Math.PI/6*H;
    }
    if(camAngleY < -Math.PI/2){
      camAngleY = -Math.PI/2;
      mouse.y = mouseInit.y + Math.PI/6*H;
    }
  }
  
  camD = new Vector(Math.sin(camAngle) * Math.sin(camAngleY - Math.PI/2),Math.sin(camAngleY),Math.cos(camAngle) * Math.sin(camAngleY - Math.PI/2));
  camL = new Vector(Math.sin(camAngle - Math.PI/2),0,Math.cos(camAngle - Math.PI/2));
  
  
  camD = camD.unit();
  camL = camL.unit();
  camU = camL.cross(camD).negative();
  camU = camU.unit();
    
 // cam.add(camD.multiply(-s));
}

function doView(v){
  return new Vector(
    (v.x - cam.x) * camL.x + (v.y - cam.y) * camL.y + (v.z - cam.z) * camL.z,
    (v.x - cam.x) * camU.x + (v.y - cam.y) * camU.y + (v.z - cam.z) * camU.z,
    (v.x - cam.x) * camD.x + (v.y - cam.y) * camD.y + (v.z - cam.z) * camD.z);
}

function sorting(a, b){
  if(a[1] < b[1])
    return 1;
  else if(a[1] > b[1])
    return -1;
  else
    return 0;
}

function jump(){
  if(!jLock){
    velocity.y += 2;
    jLock = true;
  }
}

function init(){
  
  mouseInit = new Vector(W/2,H/2,0);
  
  perspectiveM = Matrix.perspective(fov, W/H, n, far);
  
  
 // createCube(new Vector( 4*s, s, s),new Vector( 2*s, -s, -s));
  
// createCube(new Vector( s, s, 9*s),new Vector( -s, -s, 7*s));
  
 createCube(new Vector( 8*s, s, 12*s),new Vector( -8*s, -s, 11*s));
  
 //createCube(new Vector( 0.5*s, 2*s, 6*s),new Vector( 0, -s, 5.5*s));
  
 createCylinder(new Vector( 0.5*s, 2*s, 6*s), s/2, -3*s, 10);
  
  
  
  loadModel("ressources/gun.obj", gunOriginal, 1, function(){
            gun = gunOriginal.slice(0);
            if(true){
                modelRot(gun, new Vector(Math.PI/2,0,0));
                modelTrans(gun, new Vector(-0.1,-2.1,3));
            }
            else{
                modelRot(gunOriginal, new Vector(Math.PI/2,0,0));
                modelTrans(gunOriginal, new Vector(-5,-5,10));
            }
        });
//  loadModel("ressources/ingenieur.obj", poly, 0.1, function(){
//            //modelTrans(poly, new Vector(10,10,-10));
//        });
        
//  loadModel("http://jsbin.com/uvanat/2", poly, 0.1);
//  loadModel("http://jsbin.com/uvanat/6", gun, 1);
  
}

function loop(){
    if(!pause){
        update();
        draw();
    }
}


function drawPause(){
    ctx.fillStyle = "black";
    ctx.fillRect (W/2-40,H/3, 30, 100);
    ctx.fillRect (W/2+10,H/3, 30, 100);
}

function paused(){
    pause = !pause;
  if(pause) 
    drawPause();
}
init();
setInterval(loop, 1000/framerate);

function setMousePos(event){
  mouse.x = event.clientX;
  mouse.y = event.clientY;
}


function doKeyDown(evt){
  switch (evt.keyCode) {
    case 38:  /* Up arrow was pressed */
      camAngleY -= Math.PI/64;
    break;
    case 40:  /* Down arrow was pressed */
      camAngleY += Math.PI/64;
    break;
    case 37:  /* Left arrow was pressed */
      camAngle -= Math.PI/64;
       // cam.x -= 1;
    break;
    case 39:  /* Right arrow was pressed */
        //cam.x += 1;
      camAngle += Math.PI/64;
     // camD = vecRot(camD, new Vector(-Math.PI/64, 0, 0));
    break;
    case 87:  ///w
       //  cam.z += 1;
        cam = cam.add(camD);
    break;
    case 83:  //s
       //  cam.z -= 1;
        cam = cam.subtract(camD);
    break;
    case 81: //q
        fOn = !fOn;
    break;
    case 68: //d
        // cam.x += 1;
        cam = cam.subtract(camL);
    break;
    case 65:  //a
        // cam.x -= 1;
        cam = cam.add(camL);
    break;
    case 32: //space
        jump();
    break;
    case 88: //x
        tLock = !tLock;
        timerT = new Date().getTime();
    break;
    case 90:  //z
    break;
  }
}
function doKeyPress(evt){
  switch (evt.keyCode) {
    case 27: //echap
        paused();
  break;
    case 26: // I don't know what went wrong...
  break;
  }
}
window.addEventListener('keydown',doKeyDown,true);
window.addEventListener('keypress',doKeyPress,true);


//Code from : https://developer.mozilla.org/en-US/docs/API/Pointer_Lock_API#Browser_compatibility
var elem;
document.addEventListener("mousemove", function(e) {
  var movementX = e.movementX       ||
                  e.mozMovementX    ||
                  e.webkitMovementX ||
                  0,
      movementY = e.movementY       ||
                  e.mozMovementY    ||
                  e.webkitMovementY ||
                  0;
   mouse.x += movementX;
   mouse.y += movementY;
  // Print the mouse movement delta values
 // console.log("movementX=" + movementX, "movementY=" + movementY);
}, false);
function fullscreenChange() {
  if (document.webkitFullscreenElement === elem ||
      document.mozFullscreenElement === elem ||
      document.mozFullScreenElement === elem) { // Older API upper case 'S'.
    // Element is fullscreen, now we can request pointer lock
    elem.requestPointerLock = elem.requestPointerLock    ||
                              elem.mozRequestPointerLock ||
                              elem.webkitRequestPointerLock;
    elem.requestPointerLock();
  }
}
 
document.addEventListener('fullscreenchange', fullscreenChange, false);
document.addEventListener('mozfullscreenchange', fullscreenChange, false);
document.addEventListener('webkitfullscreenchange', fullscreenChange, false);
 
function pointerLockChange() {
  if (document.mozPointerLockElement === elem ||
      document.webkitPointerLockElement === elem) {
    console.log("Pointer Lock was successful.");
  } else {
    console.log("Pointer Lock was lost.");
  }
}
 
document.addEventListener('pointerlockchange', pointerLockChange, false);
document.addEventListener('mozpointerlockchange', pointerLockChange, false);
document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
 
function pointerLockError() {
  console.log("Error while locking pointer.");
}
 
document.addEventListener('pointerlockerror', pointerLockError, false);
document.addEventListener('mozpointerlockerror', pointerLockError, false);
document.addEventListener('webkitpointerlockerror', pointerLockError, false);
 
function lockPointer() {
  elem = document.getElementById("pointer-lock-element");
  // Start by going fullscreen with the element.  Current implementations
  // require the element to be in fullscreen before requesting pointer
  // lock--something that will likely change in the future.
  elem.requestFullscreen = elem.requestFullscreen    ||
                           elem.mozRequestFullscreen ||
                           elem.mozRequestFullScreen || // Older API upper case 'S'.
                           elem.webkitRequestFullscreen;
  elem.requestFullscreen();
}