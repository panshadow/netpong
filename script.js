(function($,window,undefined){

  var Puck = function( cf ){
    var self = this;
    var opt = $.extend({
      ex: [0,100],
      ey: [0,100],
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      r: 5,
      ts: +(new Date()),
      fgPuck: '#ff0000'
    },cf);

    self.set = function(key,value){
      if( key in opt ){
        opt[key] = value;
      }
    }

    self.get = function(key){
      if( key in opt ){
        return opt[key];
      }
    }



    self.move = function(){
      var now = +(new Date()),
        dt = now-opt.ts;
        dx = Math.round(opt.vx*dt/1000),
        dy = Math.round(opt.vy*dt/1000);
      opt.x += dx;
      if( opt.x > opt.ex[1] ){
        opt.x = 2*opt.ex[1] - opt.x;
        opt.vx = -opt.vx;
      }
      else if( opt.x <= opt.ex[0] ){
        opt.x = 2*opt.ex[0] - opt.x;
        opt.vx = -opt.vx;
      }

      opt.y += dy;
      if( opt.y > opt.ey[1] ){
        opt.y = 2*opt.ey[1] - opt.y;
        opt.vy = -opt.vy;
      }
      else if( opt.y < opt.ey[0] ){
        opt.y = 2*opt.ey[0] - opt.y;
        opt.vy = -opt.vy;
      }

      opt.ts = now;
      return { x: opt.x, y: opt.y, r:opt.r, rx: opt.x-opt.r,ry:opt.y-opt.r,rw: 2*opt.r,rh: 2*opt.r };
    }

  }

  var NetPong = function(cf){
    var self = this;

    // DOM elements
    var $e = {};

    // flags
    var $f = {
      online: 0
    };

    var puck = [];

    var fnLoop = function(){};
    var fcounter = 0;
    var fps = 0;
    var opt = $.extend({
      width: 640,
      height: 480,
      bgBoard: '#ffffff',
      fgBorder: '#0000ff',
      fgPuck: '#ff0000',
      pnum: 2
    },cf);

    for(var i=0;i<opt.pnum;i++){
      puck.push( new Puck({ x: 20, y: 20 }) );
    }


    self.init = function(){
      var canvasAttr = {
        width: opt.width,
        height: opt.height
      }

      $e.board = $( opt.el );
      $e.canvas = $('<canvas />').attr(canvasAttr);
      $e.buffCanvas = $('<canvas />').attr(canvasAttr);

      $e.board.append($e.canvas);
      $e.ctx =  $e.canvas[0].getContext('2d');
      //$e.ctx = $e.buffCanvas[0].getContext('2d');
      fnLoop = function(){ self.gameLoop(); }

      self.drawBorder();
      fnLoop();
      //self.start();
    }

    self.gameLoop = function(){
      if( $f.online ){
        webkitRequestAnimationFrame( fnLoop, $e.canvas );
      }
      //self.showFrame();
      self.clearBoard();
      //self.drawBorder();

      self.drawPuck();
      self.drawFPS();
    }

    self.drawFPS = function(){
      fcounter++;
      $e.ctx.font='8px Arial';
      $e.ctx.fillStyle='#000000';
      $e.ctx.fillText('FPS'+fps,50,50);
    }

    self.updateFPS = function(){
      fps = fcounter;
      fcounter = 0;
    }

    self.showFrame = function(){
      $e.out.putImageData( $e.ctx.getImageData(0,0,opt.width,opt.height), 0, 0 );
    }

    self.clearBoard = function(){
      //$e.ctx.clearRect(10,10,opt.width-20,opt.height-20);
      $e.ctx.fillStyle=opt.bgBoard;
      $e.ctx.fillRect(10,10,opt.width-20,opt.height-20);
    }

    self.drawBorder = function(){
      $e.ctx.clearRect(0,0,opt.width,opt.height);
      $e.ctx.fillStyle=opt.bgBoard;
      $e.ctx.fillRect(0,0,opt.width,opt.height);
      $e.ctx.lineWidth=10;
      $e.ctx.strokeStyle=opt.fgBorder;
      $e.ctx.strokeRect(0,0,opt.width,opt.height);
    }

    self.drawPuck = function(){
      for(var i=0,n=puck.length;i<n;i++){
        var pp = puck[i].move();
        $e.ctx.fillStyle=puck[i].get('fgPuck');
        $e.ctx.beginPath();
        $e.ctx.arc(pp.x,pp.y,pp.r,0,2*Math.PI);
        $e.ctx.closePath();
        $e.ctx.fill();
      }
    }

    self.start = function(){
      var ex = [15,opt.width-15];
      var ey = [15,opt.height-15];
      for( var i=0,n=puck.length;i<n;i++){
        puck[i].move();
        var vx = 30 + Math.round(Math.random()*200);
        var vy = 30 + Math.round(Math.random()*200);
        //var color = Math.round(Math.sqrt(vx*vx+vy*vy));
        puck[i].set('vx',vx);
        puck[i].set('vy',vy);
        puck[i].set('fgPuck','rgb('+vx+','+vy+',0)')
        puck[i].set('ex',ex);
        puck[i].set('ey',ey);
      }

      self.drawBorder();
      $f.online = true;//setInterval(fnLoop,10);
      $f.fps = setInterval(function(){ self.updateFPS(); },1000);
      fnLoop();

    }

    self.stop = function(){
      if( $f.online ){
        //clearInterval($f.online);
        $f.online = false;

      }

      if( $f.fps ){
        clearInterval($f.fps);
        $f.fps = 0;
      }
    }

    self.getPuck = function(){
      return puck;
    }



    $(function(){
      self.init();
    });

    return self;

  }

  window.NetPong = NetPong;

})(jQuery,this);

var np = new NetPong({ 'el': '#game',pnum: 400 });
$(function(){
  setTimeout(function(){ np.stop(); }, 1000*30 );
  np.start();
})
