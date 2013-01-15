var pause = false;
var framerate = 60;

var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
ctx.font = "12px Arial";
ctx.translate(0, 0);

var W = canvas.width, H = canvas.height;
var o = new Vector(W/2, H/2, 0);
var mouse = new Vector(0, 0, 0);
var mouseInit = new Vector();

var cam = new Vector(0, 0, 10);
var fov = 70;
var n = 0.1;
var far = 5;
var s = 10;

var camL = new Vector(1,0,0);
var camU = new Vector(0,1,0);
camL = camL.unit();
camU = camU.unit();
var camD = new Vector(0,0,1);


var camAngle = 0;
var camAngleY = 0;

var poly = Array();
var gun = Array();
var zBuffer;

var perspectiveM = new Matrix();

var pOn = true;
var cOn = true;
var fOn = true;
var velocity = new Vector(0,0,0);
var jLock = false;

var vectex = Array();
var polygon = Array();


function loadModel( url, pArray, mult){
  var allText;
  var txtFile = new XMLHttpRequest();
  txtFile.open("GET", url, true);
  txtFile.onreadystatechange = function() {
    if (txtFile.readyState === 4) {  // Makes sure the document is ready to parse.
      if (txtFile.status === 200) {  // Makes sure it's found the file.
        loadObj(txtFile.responseText, pArray, mult);
      }
    }
  };
  txtFile.send(null);
}



function loadObj( txt, pArray, mult) {
    vectex = Array();
    polygon = Array();
    var g, fArray;
    txt = txt.split("\n");
    for(g = 0; g < txt.length; g++){
      handleData(txt[g]);
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

function handleFileSelect(evt) {
    vectex = Array();
    polygon = Array();
    var txt = "", out = "",g;
    var files = evt.target.files; // FileList object

    // Loop through the FileList and render image files as thumbnails.
    for (var i = 0, f; f = files[i]; i++) {

      var reader = new FileReader();

      // Closure to capture the file information.
      reader.onload = (function(theFile) {
        return function(e) {
        
        txt = e.target.result.split("\n");
         for(var g = 0; g < txt.length; g++){
             handleData(txt[g]);
         }
            
     var v = Array();
     for(g = 0; g < vectex.length; g++){
         v[g] = new Vector( vectex[g][0], vectex[g][1], vectex[g][2]);
     }
        var fArray;    
     for(g = 0; g < polygon.length; g++){
         fArray = Array();
         for(var p = 0; p < polygon[g].length; p++){
            fArray.push(v[polygon[g][p]]);
         }
         poly.push(new Poly(fArray));
     }
     };
     })(f);

      reader.readAsText(f);
    }
    
    
 }

function Poly(vArray){
  this.P = Array();
  for(var q = 0; q < vArray.length; q++){
    this.P[q]= vArray[q];
  }
}
//function Poly(vp){
//  this.P = vp;
//}
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

function lengthToCam( po){
  var re = 0;
  for(var q = 0; q < po.P.length; q++){
    re += po.P[q].subtract(cam).length();
  }
  return re / po.P.length;
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
function polyRotation(po, angle){
  var np = new Poly( vecRot(po.P[0], angle), vecRot(po.P[1], angle), vecRot(po.P[2], angle));
  return np;
}
function drawPoly(p){
  var V = Array();
  var Vz = Array();
  var drawed = true;
  
  for(var q = 0; q < p.P.length; q++){
    V[q] = doView(p.P[q]);
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

function drawModel( pArray){
  zBuffer = Array();
  for(var q = 0; q < pArray.length; q++){
    var foo = Array(2);
    
    foo[0] = q;
    foo[1] = lengthToCam(pArray[q]);
    zBuffer.push(foo);
  }
  
  zBuffer.sort(sorting);
  
  for(q = 0; q < zBuffer.length; q++){
    drawPoly(pArray[zBuffer[q][0]]);
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
  
  drawModel(poly);
  drawModel(gun);
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

function update(){
  
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
  
  
  
  loadModel("ressources/ingenieur.obj", poly, 0.1);
  loadModel("ressources/gun.obj", gun, 1);
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
        pOn = !pOn;
    break;
    case 90:  //z
        cOn = !cOn;
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
document.getElementById('files').addEventListener('change', handleFileSelect, false);


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