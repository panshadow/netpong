(function(window,undefined){
  var when_is = window.when_is = function(name,fn,res){
    var res0;
    var test;
    try {
      if( typeof fn === 'function' ){
        res0 = fn();
      }
      else{
        res0 = fn;
      }

      if( res0 === res ){
        test='success';
      }
      else{
        test='failed';
      }
    }
    catch(e){
      test='broken';
    }
    console.log('test %s is %s',name,test);
    return (test === 'success');
  }

  var when_keys = window.when_keys = function(name,fn,res){
    var res0;
    var test;
    var all = true;
    try {
      if( typeof fn === 'function' ){
        res0 = fn();
      }
      else{
        res0 = fn;
      }

      for(var key in res){
        all &= when_is(name+'.'+key+' has ',(key in res0),true);
        all &= when_is(name+'.'+key+' is ',res0[key],res[key]);
      }

      test = all ? 'success' : 'failed';

    }
    catch(e){
      test='broken';
    }

    console.log('test %s is %s',name,test);
    return (test === 'success');
  }

})(this);
