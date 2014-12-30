//-----------------
// 2D Math Library
//-----------------
var Math2d = {};

(function(){
              
    Math2d.getPossibleTranslate = function(step, current, min, max){
        var actualStep = Math2d.diff(Math2d.max(Math2d.sum(step, current), min), current);
        return Math2d.diff(Math2d.min(Math2d.sum(actualStep, current), max), current);
    }

    Math2d.sum = function(pos1, pos2){
        return {x:pos1.x + pos2.x, y: pos1.y + pos2.y}
    }

    Math2d.diff = function(pos1, pos2){
        return {x:pos1.x - pos2.x, y: pos1.y - pos2.y}
    }

    Math2d.min = function(pos1, pos2){
        return {
            x: Math.min(pos1.x, pos2.x),
            y: Math.min(pos1.y, pos2.y)
        }
    }

    Math2d.max = function(pos1, pos2){
        return {
            x: Math.max(pos1.x, pos2.x),
            y: Math.max(pos1.y, pos2.y)
        }
    }
 
    Math2d.round = function(pos){
        return {
            x: (pos.x * 100) / 100,
            y: (pos.y * 100) / 100
        }
    }

    //2:10, 1, 1:10 = 2:10
    Math2d.translateQuad = function(minMax, translate, bounds){
        var actualTranslate = Math2d.getPossibleTranslate(translate, Math2d.round(minMax.min), bounds.min, bounds.max); // = 1
        var actualTranslateFinal = Math2d.getPossibleTranslate(actualTranslate, Math2d.round(minMax.max), bounds.min, bounds.max); // = 0
        var r = {
            min: Math2d.max(Math2d.sum(Math2d.round(minMax.min), actualTranslateFinal), bounds.min),
            max: Math2d.min(Math2d.sum(Math2d.round(minMax.max), actualTranslateFinal), bounds.max)
        }
        return r;
    }

})();

//test
var r = Math2d.translateQuad({min:{x:3,y:6}, max:{x:2430,y:957}},
                      {x:0,y:0},
                      {min:{x:0,y:0}, max:{x:2400,y:1400}}
                      );

console.log(r);