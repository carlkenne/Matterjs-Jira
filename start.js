//todo: add scaled text as pull request?


c = "";

//general functions, move to abetter place
//-----------------------------------------

Array.prototype.selectMany = function(fn) {
	return this.map(fn)
    	.reduce(function(x,y) {
        	return x.concat(y);
        },[]);
};

Array.prototype.first = function(fn){
    if(this.length > 0){
        if(fn){
            fn(this[0]);
        }
        return this[0];
    }
};

Array.prototype.empty = function(fn){
    if(this.length == 0){
        fn();
    }
    return this;
};

var wrapText = function(text, width) {
    var returnArray = [];
    var words = text ? text.split(' '): '';
    var line = '';
    
    for(var n = 0; n < words.length; n++) {
        var testLine = line + words[n] + ' ';
        var metrics = c.measureText(testLine);
        var testWidth = metrics.width;
        if (testWidth > width && n > 0) {
            returnArray.push(line);
            line = words[n] + ' ';
        }
        else {
            line = testLine;
        }
    }
    returnArray.push(line);
    return returnArray;
};
//-----------------------------------------

(function() {

    // Matter aliases
    var Engine = Matter.Engine,
        World = Matter.World,
        Bodies = Matter.Bodies,
        Body = Matter.Body,
        Composite = Matter.Composite,
        Composites = Matter.Composites,
        Common = Matter.Common,
        Constraint = Matter.Constraint,
        RenderPixi = Matter.RenderPixi,
        Events = Matter.Events,
        Bounds = Matter.Bounds,
        Vector = Matter.Vector,
        Vertices = Matter.Vertices,
        MouseConstraint = Matter.MouseConstraint,
        Mouse = Matter.Mouse,
        Query = Matter.Query;

    // MatterTools aliases
    if (window.MatterTools) {
        var Gui = MatterTools.Gui,
            Inspector = MatterTools.Inspector;
    }

    var Demo = {};

    var _engine,
        _gui,
        _inspector,
        _sceneName,
        _mouseConstraint,
        _sceneEvents = [],
        _useInspector = window.location.hash.indexOf('-inspect') !== -1,
        _isMobile = /(ipad|iphone|ipod|android)/gi.test(navigator.userAgent);

    // initialise the demo

    Demo.init = function() {
        var container = document.getElementById('canvas-container');

        // some example engine options
        var options = {
            positionIterations: 6,
            velocityIterations: 4,
            enableSleeping: false,
            render: {options: {width: 1200, height: 700}, bounds: {max: { x: 1200, y: 700 }, min:{ x: 0, y: 0 }}},
            world: {bounds: {max: { x: 2400, y: 1400 },min:{x:0, y:0}}},
        };
        _engine = Engine.create(container, options);

        _mouseConstraint = MouseConstraint.create(_engine);
        World.add(_engine.world, _mouseConstraint);

        // run the engine
        Engine.run(_engine);

        // default scene function name
        _sceneName = 'mixed';

        // get the scene function name from hash
        if (window.location.hash.length !== 0)
            _sceneName = window.location.hash.replace('#', '').replace('-inspect', '');

		getCards(function(cards){
			// set up a scene with bodies
			var management = cardManagement(cards)
    	    Demo['toyotaKata'](management);
    	});
        
        // set up demo interface (see end of this file)
        Demo.initControls();
    };

    if (window.addEventListener) {
        window.addEventListener('load', Demo.init);
    } else if (window.attachEvent) {
        window.attachEvent('load', Demo.init);
    }
 
 
    ZoomBehaviour = function(_engine){
        //var =
    }

    Demo.toyotaKata = function(cardManagement) {
        var _world = _engine.world;
        c = _engine.render.context;
             c.font = "12px Arial";
        var cardWidth = 120;
        var cardHeight = 80;
        var cardTextWidth = cardWidth - 25;
        var nextStepsRow = 200;
        var cardTypes = [
            {fillStyle:'rgba(204, 119, 119, 1)', row: 100, type: 'issue', frictionAir: 0.7 },
            {fillStyle:'rgba(119, 119, 204, 1)', fillStyleInactive: 'rgba(204, 204, 221, 1)', fillStyleDone: 'rgba(119, 119, 255, 1)', row: 400, type: 'nextStep', frictionAir: 0.01},
            {fillStyle:'rgba(119, 204, 119, 1)', row: 700, type: 'awesome', frictionAir: 0.7 }
        ];
        var bodies = [];
        _engine.render.scale = 1;
        var yCreatePosition = 1;

        var createBody = function(card, ypos) {
            var cardType = cardTypes.filter(function(item) {
               return item.type == card.type;
            }).first();

            var fillstyle = cardType.fillStyle;
            if(!card.active){
                fillstyle = cardType.fillStyleInactive;
            }

            var body = Bodies.rectangle(cardType.row, yCreatePosition * ypos, cardWidth, cardHeight, { frictionAir: cardType.frictionAir, chamfer: 10, render: { fillStyle: fillstyle }});
            body.data = card;
            body.render.originalStrokeStyle = body.render.strokeStyle = 'rgba(40, 40, 40, 1)';
            console.log(body.render.strokeStyle);
            body.data.title = wrapText("["+card.key+"] "+card.fields.summary, cardTextWidth);
            body.data.body = wrapText(card.fields.description, cardTextWidth);

            return body;
        }

        var getBodyBy = function(id){
            return bodies.filter(function(body) {
                return body.data.id == id;
            }).first()
        }

        var bindLinkedBodies = function(cards) {
        	cards.forEach(function(to){
        		cardManagement.getIdsPointingTo(to)
                          .forEach(function(fromId){
                                    connectBodies(getBodyBy(fromId), getBodyBy(to.id));
                                   })
        	});
        }
 
        var connectBodies = function(from, to){
            var c = Constraint.create({
                           bodyA: from,
                           bodyB: to,
                           stiffness: 0.001,
                           length: 150,
                           render: {
                           lineWidth: 2,
                           strokeStyle: 'rgba(150,150,0,0.4)'
                        }
            });
            Composite.addConstraint(everything, c);
        };


        var createCard = function(card){
            bodies.push(createBody(card, yCreatePosition++));
        }
 
        // - - - - - Highlighting
        var toTransparent = function(body){
            body.render.fillStyle = body.render.fillStyle.replace(", 1)",", 0.6)");
            body.render.strokeStyle = body.render.strokeStyle.replace(", 1)",", 0.1)");
        }

        var everythingTransparent = function() {
            bodies.forEach(function(body){
                toTransparent(body);
            });
        }

        var toSolid = function(body) {
            body.render.fillStyle = body.render.fillStyle.replace(", 0.6)",", 1)");
            body.render.strokeStyle = body.render.strokeStyle.replace(", 0.1)",", 1)");
        }

        var setSolidOn = function(list) {
            list.forEach(function(body) {
                toSolid(body);
            });
        }

        var showHighlight = function(card) {
            card.render.hasHighlight = true;
            card.render.strokeStyle = "rgba(255, 221, 0, 1)";
            card.render.lineWidth = 3;
        }

        var hideHighlight = function(card) {
            card.render.strokeStyle = card.render.originalStrokeStyle;
            card.render.hasHighlight = false;
            card.render.lineWidth = 1;
        }

        var hideAllHighlights = function() {
            bodies.forEach(hideHighlight);
        }

        function highlightCard(hit) {
            var show = !hit.body.render.hasHighlight;
            everythingTransparent();

            if (show) {
                cardManagement.getAllConnectedCards(hit.body.data)
                    .map(function (c) {
                        var body = getBodyBy(c.id);
                        toSolid(body);
                    });
            }
            var cardInfo = document.querySelector(".current-card");
            cardInfo.style.display = "block";
            cardInfo.style.backgroundColor = hit.body.render.fillStyle;
            cardInfo.style.border = "2px solid " + hit.body.render.strokeStyle;

            cardInfo.innerHTML = "<h2>" + hit.body.data.title.join('') + "</h2>";
            cardInfo.innerHTML += hit.body.data.body.join('');
        }
 
        Events.on(_engine, 'mousemove', function(event) {

            if(!_mouseConstraint.constraint.bodyB && event.mouse.button == 0) {
                panBackground(event);
                return;
            }
            
            Query.ray(bodies, event.mouse.position, Math2d.sum(event.mouse.position,{x:1, y:1}))
                .empty(function(){
                    setSolidOn(bodies);
                    document.querySelector(".current-card").style.display = "none";
                })
                .first(function(hit) {
                    highlightCard(hit);
                });
        });
 
        Events.on(_engine, 'mouseup', function(event) {
            Mouse.setOffset(_engine.input.mouse, _engine.render.bounds.min );
        });

        var getStepMultiply = function(requestedStep, currentValue, min, max){
            var actualStep = Math.max(requestedStep * currentValue, min) / currentValue;
            return Math.min(actualStep * currentValue, max) / currentValue;
        }
        
        document.querySelector(".zoom-reset").addEventListener('click', function(){
        	applyZoom(1.0/_engine.render.scale, _engine.render.bounds.min);
        });
 
        document.querySelector(".zoom-in").addEventListener('click', function(){
            applyZoom(1.1/_engine.render.scale, _engine.render.bounds.min);
        });
 
        document.querySelector(".zoom-out").addEventListener('click', function(){
            applyZoom(0.9/_engine.render.scale, _engine.render.bounds.min);
        });

        document.querySelector("canvas").onmousewheel = function (event) {
            var mouse = {x: event.clientX, y: event.clientY};
            var wheel = event.wheelDelta / 120;
            
            var scaleLimits = { min:0.5, max:1.5 };
            
            var zoom = Math.pow(1 + Math.abs(wheel)/2 , wheel > 0 ? 1 : -1);
            zoom = getStepMultiply( zoom, _engine.render.scale, scaleLimits.min, scaleLimits.max);
            
        	applyZoom(zoom, mouse);
        }
 
        var panBackground = function(event) {
                var panAmount = { x: event.mouse.mousedownPosition.x - event.mouse.position.x , y: event.mouse.mousedownPosition.y - event.mouse.position.y }
                _engine.render.bounds = Math2d.translateQuad(_engine.render.bounds, panAmount, _engine.world.bounds)
                Mouse.setOffset(_engine.input.mouse,  _engine.render.bounds.min);
        }

		var applyZoom = function(zoomStep, mousePosition) {

            _engine.render.scale *= zoomStep;
            document.querySelector(".zoom-value").innerHTML = (_engine.render.scale + "").substr(0, 5);
 
            var diff = Math2d.diff(_engine.render.bounds.max, _engine.render.bounds.min);
            var xPixelStep = (diff.x * zoomStep)-diff.x;
            var xBalance = (mousePosition.x / _engine.render.options.width);
 
            _engine.render.bounds.max.x += xPixelStep * (1 - xBalance);
            _engine.render.bounds.min.x -= xPixelStep * xBalance;
 
            var yPixelStep = (diff.y * zoomStep) - diff.y;
            var yBalance = (mousePosition.y / _engine.render.options.height);
            _engine.render.bounds.max.y += yPixelStep * (1-yBalance);
            _engine.render.bounds.min.y -= yPixelStep * yBalance;
 
            _engine.render.bounds = Math2d.translateQuad(_engine.render.bounds, {x: 0, y: 0}, _engine.world.bounds);
 
            Mouse.setScale(_engine.input.mouse, {x:_engine.render.scale, y:_engine.render.scale});
            Mouse.setOffset(_engine.input.mouse,  _engine.render.bounds.min);
		}

        Events.on(_engine, 'onRender', function(event) {
            c.fillStyle = 'rgba(255, 255, 255, 0.8)';

            Composite.allBodies(everything).forEach(function(box){
                Body.rotate(box, -box.angle);
                for(t = 0; t < box.data.title.length; t++){
                                                    //c.scale(3,3)
                    c.fillText(box.data.title[t],
                               (box.position.x) - (cardWidth)/2 + 5,
                               (box.position.y) - 25 + (t * 16));
                }
            });
        });
 
        Demo.reset();
        cardManagement.getCards().forEach(createCard);
        var everything = Composite.create({bodies:bodies});
        World.add(_world, everything);
        bindLinkedBodies(cardManagement.getCards());
        _engine.render.options.showShadows = true;

 
    };

    Demo.initControls = function() {
            var demoSelect = document.getElementById('demo-select'),
                demoReset = document.getElementById('demo-reset');

            // create a Matter.Gui
            if (!_isMobile && Gui) {
                _gui = Gui.create(_engine);

                // need to add mouse constraint back in after gui clear or load is pressed
                Events.on(_gui, 'clear load', function() {
                    _mouseConstraint = MouseConstraint.create(_engine);
                    World.add(_engine.world, _mouseConstraint);
                });
            }

            // create a Matter.Inspector
            if (!_isMobile && Inspector && _useInspector) {
                _inspector = Inspector.create(_engine);

                Events.on(_inspector, 'import', function() {
                    _mouseConstraint = MouseConstraint.create(_engine);
                    World.add(_engine.world, _mouseConstraint);
                });

                Events.on(_inspector, 'play', function() {
                    _mouseConstraint = MouseConstraint.create(_engine);
                    World.add(_engine.world, _mouseConstraint);
                });

                Events.on(_inspector, 'selectStart', function() {
                    _mouseConstraint.constraint.render.visible = false;
                });

                Events.on(_inspector, 'selectEnd', function() {
                    _mouseConstraint.constraint.render.visible = true;
                });
            }

            // go fullscreen when using a mobile device
            if (_isMobile) {
                var body = document.body;

                body.className += ' is-mobile';
                _engine.render.canvas.addEventListener('touchstart', Demo.fullscreen);

                var fullscreenChange = function() {
                    var fullscreenEnabled = document.fullscreenEnabled || document.mozFullScreenEnabled || document.webkitFullscreenEnabled;

                    // delay fullscreen styles until fullscreen has finished changing
                    setTimeout(function() {
                        if (fullscreenEnabled) {
                            body.className += ' is-fullscreen';
                        } else {
                            body.className = body.className.replace('is-fullscreen', '');
                        }
                    }, 2000);
                };

                document.addEventListener('webkitfullscreenchange', fullscreenChange);
                document.addEventListener('mozfullscreenchange', fullscreenChange);
                document.addEventListener('fullscreenchange', fullscreenChange);
            }

        };

        Demo.fullscreen = function(){
            var _fullscreenElement = _engine.render.canvas;

            if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement) {
                if (_fullscreenElement.requestFullscreen) {
                    _fullscreenElement.requestFullscreen();
                } else if (_fullscreenElement.mozRequestFullScreen) {
                    _fullscreenElement.mozRequestFullScreen();
                } else if (_fullscreenElement.webkitRequestFullscreen) {
                    _fullscreenElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
                }
            }
        };

    Demo.reset = function() {
        var _world = _engine.world;

        World.clear(_world);
        Engine.clear(_engine);

        // clear scene graph (if defined in controller)
        var renderController = _engine.render.controller;
        if (renderController.clear)
            renderController.clear(_engine.render);

        // clear all scene events
        for (var i = 0; i < _sceneEvents.length; i++)
            Events.off(_engine, _sceneEvents[i]);

        if (_mouseConstraint.events) {
            for (i = 0; i < _sceneEvents.length; i++)
                Events.off(_mouseConstraint, _sceneEvents[i]);
        }

        if (_world.events) {
            for (i = 0; i < _sceneEvents.length; i++)
                Events.off(_world, _sceneEvents[i]);
        }

        _sceneEvents = [];

        // reset id pool
        Common._nextId = 0;

        // reset random seed
        Common._seed = 0;

        // reset mouse offset and scale (only required for Demo.views)
        Mouse.setScale(_mouseConstraint.mouse, { x: 1, y: 1 });
        Mouse.setOffset(_mouseConstraint.mouse, { x: 0, y: 0 });

        _engine.enableSleeping = false;
        _engine.world.gravity.y = 0;
        _engine.world.gravity.x = 0;
        _engine.timing.timeScale = 1;

        var offset = 5;
        World.add(_world, [
            Bodies.rectangle((_world.bounds.max.x)/2, -offset, (_world.bounds.max.x) + 2 * offset, 50.5, { isStatic: true }),
            Bodies.rectangle((_world.bounds.max.x)/2, (_world.bounds.max.y) + offset, (_world.bounds.max.x) + 2 * offset, 50.5, { isStatic: true }),
            Bodies.rectangle((_world.bounds.max.x) + offset, (_world.bounds.max.y/2), 50.5, (_world.bounds.max.y) + 2 * offset, { isStatic: true }),
            Bodies.rectangle(-offset, (_world.bounds.max.y/2), 50.5, (_world.bounds.max.y) + 2 * offset, { isStatic: true })
        ]);

        _mouseConstraint = MouseConstraint.create(_engine);
        World.add(_world, _mouseConstraint);

        var renderOptions = _engine.render.options;
        renderOptions.wireframes = false;
        renderOptions.hasBounds = true;
        renderOptions.showDebug = true;
        renderOptions.showBroadphase = false;
        renderOptions.showBounds = false;
        renderOptions.showVelocity = false;
        renderOptions.showCollisions = false;
        renderOptions.showAxes = false;
        renderOptions.showPositions = false;
        renderOptions.showAngleIndicator = false;
        renderOptions.showIds = false;
        renderOptions.showShadows = false;
        renderOptions.background = '#fff';

        if (_isMobile)
            renderOptions.showDebug = true;
    };

})();