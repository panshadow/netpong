(function($,window,undefined){


  var Reflector = function(cf){
    var self = $.extend({
      level: 0,
      north: 0,
      east: 0,
      south: 0,
      west: 0,
      inside: true,

      through_north: function(y,vy){return (y<this.north && vy<0) },

      through_west: function(x,vx){return (x<this.west && vx<0) } ,
      through_south: function(y,vy){return (y>this.south && vy>0) },
      through_east: function(x,vx){return (x>this.east && vx>0) },

      affected: function(id,x,y,vx,vy){
        var self = this;
        return self.inside && ( self.through_north(y,vy)
          || self.through_west(x,vx)
          || self.through_south(y,vy)
          || self.through_east(x,vx) )
        || !self.inside && (
          y > self.north
          && y < self.south
          && x > self.west
          && x <self.east);
      },
      reflect: function(id,x,y,vx,vy){
        var resp = {}

        if( self.through_north(y,vy) ){ resp.vy = -vy; resp.y = 2*self.north - y; }
        if( self.through_east(x,vx) ){ resp.vx = -vx; resp.x = 2*self.east - x; }
        if( self.through_south(y,vy) ){ resp.vy = -vy; resp.y = 2*self.south - y; }
        if( self.through_west(x,vx) ){ resp.vx = -vx; resp.x = 2*self.west - x; }
        return resp;
      }
    },cf);

    return self;

  }

  var last_puck_id=0;

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
      fgPuck: '#ff0000',
      board: null
    },cf);

    var id = +(++last_puck_id);



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

    self.getID = function(){
      return id;
    }


    self.moving = function(){
      return Math.round(opt.vx) || Math.round(opt.vy);
    }


    self.move = function(){
      var now = +(new Date()),
        dt = now-opt.ts;
        dx = opt.vx*dt/1000,
        dy = opt.vy*dt/1000;
      opt.x += dx;
      opt.y += dy;

      if( self.moving() ){
        $.extend( opt, opt.board.reflect( id, opt.x,opt.y,opt.vx,opt.vy) );
      }


      opt.ts = now;
      return { x: Math.round(opt.x), y: Math.round(opt.y), r:opt.r, rx: Math.round(opt.x-opt.r),ry: Math.round(opt.y-opt.r),rw: 2*opt.r,rh: 2*opt.r };
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
    var time = 0;
    var fnLoop = function(){};
    var fcounter = 0;
    var fps = 0;
    var opt = $.extend({
      width: 640,
      height: 480,
      bgBoard: '#ffffff',
      fgBorder: '#0000ff',
      fgPuck: '#ff0000',
      pnum: 2,
      ptime: 15
    },cf);

    for(var i=0;i<opt.pnum;i++){
      puck.push(
        new Puck({
          board: self
        })
      );
    }

    var reflectors = [];
    var score = [0,0];

    reflectors.push(Reflector({
      level: 10,
      north: 15,
      east: opt.width-15,
      south: opt.height-15,
      west: 15,
    }));




    reflectors.push(Reflector({
      level: 20,
      score: {},
      affected: function(id,x,y,vx,vy){
        var cy = opt.height >> 1; return ( (x<15 || x>opt.width-15) && y >= cy-60 && y <=cy+60 ); },
      reflect: function(id,x,y,vx,vy){
        if( ! (id in this.score) ){
          if( x < (opt.width>>1) ){
            score[0]++;
          }
          else{
            score[1]++;
          }
          this.score[id]=1;
        }
        var res = { vy: 0 };
        if( vx != 0){
          res.vx = (vx<0 ? -5 : 5);
        }
        if( x<=10 || x>=opt.width-10){
          res.vx=0;
          if( x < (opt.width>>1) ){
            res.x = 5;
          }
          else{
            res.x = opt.width - 5;
          }

        }
        return res;
      }
    }));


    var accelerator = Reflector({
      level: 20,
      north: 370,
      east: opt.width-150,
      south: 390,
      west: 150,
      inside: false,
      pucks: {},
      reflect: function(id,x,y,vx,vy){
        for(var i=0,n=puck.length;i<n;i++){
          if(puck[i].getID() === id){
            puck[i].set('fgPuck','#0000ff');
          }
        }
        var resp = {};
        if( !(id in this.pucks) ){

          var r = Math.sqrt(vx*vx + vy*vy);
          resp.vx=Math.round(vx*300/r);
          resp.vy=Math.round(vy*300/r)
          this.pucks[id] = true;
        }

        return resp;
      }
    });

    reflectors.push(accelerator);



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
      fnLoop = function(){ if( !$f.online ){ return }; self.gameLoop(); }

      self.drawBorder();
      fnLoop();
      //self.start();
    }


    self.reflect = function(){
      var r = null;
      var resp = {};
      for(var i=0,n=reflectors.length;i<n;i++){
        var obj = reflectors[i];
        if( obj.affected.apply(obj,arguments) && (r == null || obj.level > r.level) ){
          r = obj;
        }
      }

      if( r !== null ){
        resp = r.reflect.apply(r,arguments);
      }
      return resp;
    }


    self.gameLoop = function(){
      if( $f.online ){
        webkitRequestAnimationFrame( fnLoop, $e.canvas );
      }
      //self.showFrame();
      //self.clearBoard();
      self.drawBorder();
      self.drawLine();
      self.drawAccelerator();
      self.drawScore();
      self.drawPuck();
      self.drawFPS();
    }

    self.drawFPS = function(){
      fcounter++;
      $e.ctx.font='8px Arial';
      $e.ctx.fillStyle='#000000';
      $e.ctx.fillText('FPS:'+fps+' time: '+time,50,50);
    }


    self.drawScore = function(){
      $e.ctx.font='bold 56px Arial';
      $e.ctx.fillStyle='rgb(0,0,255)';
      $e.ctx.textAlign = 'right';
      $e.ctx.fillText(score[0], (opt.width >> 1) - 10,70);

      $e.ctx.font='bold 56px Arial';
      $e.ctx.fillStyle='rgb(255,0,0)';
      $e.ctx.textAlign = 'left';
      $e.ctx.fillText(score[1], (opt.width >> 1) + 10,70);
    }

    self.updateFPS = function(){
      if( !$f.online ){ return };
      fps = fcounter;
      fcounter = 0;
      if( ! --time ){
        self.stop();
      }

    }

    self.drawAccelerator = function(){
      $e.ctx.fillStyle = 'yellow';
      $e.ctx.fillRect(
        accelerator.west,
        accelerator.north,
        accelerator.east - accelerator.west,
        accelerator.south - accelerator.north
      );
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
      $e.ctx.strokeRect(5,5,opt.width-10,opt.height-10);

      $e.ctx.strokeStyle=opt.bgBoard;
      $e.ctx.beginPath();
      $e.ctx.moveTo(5,(opt.height>>1) - 65);
      $e.ctx.lineTo(5,(opt.height>>1) + 65);
      $e.ctx.stroke();

      $e.ctx.strokeStyle=opt.bgBoard;
      $e.ctx.beginPath();
      $e.ctx.moveTo(opt.width-5,(opt.height>>1) - 65);
      $e.ctx.lineTo(opt.width-5,(opt.height>>1) + 65);
      $e.ctx.stroke();

    }

    self.drawLine = function(){
      var cx = opt.width >> 1,
        cy = opt.height >> 1;

      $e.ctx.fillStyle=opt.fgBorder;
      $e.ctx.strokeStyle = opt.fgBorder;

      $e.ctx.lineWidth=6;
      $e.ctx.beginPath();

      $e.ctx.moveTo( cx,0 );
      $e.ctx.lineTo( cx, opt.height);
      $e.ctx.stroke();

      $e.ctx.beginPath();
      $e.ctx.arc( cx, cy ,8,0,2*Math.PI);
      $e.ctx.closePath();
      $e.ctx.fill();

      $e.ctx.beginPath();
      $e.ctx.arc( cx, cy ,65,0,2*Math.PI);
      $e.ctx.closePath();
      $e.ctx.stroke();



    }

    self.drawPuck = function(){
      for(var i=0,n=puck.length;i<n;i++){
        var pp = puck[i].move();
        if( puck[i].moving() ){
          var pid = puck[i].getID();
          $e.ctx.fillStyle=puck[i].get('fgPuck');


          $e.ctx.beginPath();
          $e.ctx.arc(pp.x,pp.y,pp.r,0,2*Math.PI);
          $e.ctx.closePath();
          $e.ctx.fill();
        }
      }
    }

    self.drawRocket = function(){
      $e.ctx.beginPath();

    }

    self.start = function(){
      var ex = [15,opt.width-15];
      var ey = [15,opt.height-15];
      for( var i=0,n=puck.length;i<n;i++){
        puck[i].move();
        var r = 200+Math.round(Math.random()*100);
        var a = Math.PI*(Math.random()/2-3/4);
        var vx = Math.round(r*Math.cos(a));
        var vy = Math.round(r*Math.sin(a));
        //var color = Math.round(Math.sqrt(vx*vx+vy*vy));
        puck[i].set('vx',vx);
        puck[i].set('vy',vy);
        puck[i].set('fgPuck',opt.fgPuck);
        puck[i].set('ex',ex);
        puck[i].set('ey',ey);
        puck[i].set('x',opt.width>>1);
        puck[i].set('y',opt.height>>1);
      }

      self.drawBorder();
      $f.online = true;//setInterval(fnLoop,10);
      $f.fps = setInterval(function(){ self.updateFPS(); },1000);
      time = opt.ptime;
      score = [0,0];
      fcounter=0;
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

    self.is_online = function(){
      return $f.online;
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
  window.Reflector = Reflector;

})(jQuery,this);
