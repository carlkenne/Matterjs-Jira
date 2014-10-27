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
            enableSleeping: false

        };

        // create a Matter engine
        // NOTE: this is actually Matter.Engine.create(), see the aliases at top of this file
        _engine = Engine.create(container, options);


        // add a mouse controlled constraint
        _mouseConstraint = MouseConstraint.create(_engine);
        World.add(_engine.world, _mouseConstraint);

        // run the engine
        Engine.run(_engine);

        // default scene function name
        _sceneName = 'mixed';

        // get the scene function name from hash
        if (window.location.hash.length !== 0)
            _sceneName = window.location.hash.replace('#', '').replace('-inspect', '');

        // set up a scene with bodies
        Demo['toyotaKata']();

        // set up demo interface (see end of this file)
        Demo.initControls();
    };

    // call init when the page has loaded fully

    if (window.addEventListener) {
        window.addEventListener('load', Demo.init);
    } else if (window.attachEvent) {
        window.attachEvent('load', Demo.init);
    }

    Demo.airFriction = function() {
        var _world = _engine.world;

        Demo.reset();

        World.add(_world, [
            Bodies.rectangle(200, 100, 60, 60, { frictionAir: 0.001 }),
            Bodies.rectangle(400, 100, 60, 60, { frictionAir: 0.05 }),
            Bodies.rectangle(600, 100, 60, 60, { frictionAir: 0.1 })
        ]);

        var renderOptions = _engine.render.options;
        renderOptions.showAngleIndicator = true;
        renderOptions.showCollisions = true;
    };

    Demo.toyotaKata = function() {
        var _world = _engine.world;
        var c = _engine.render.context;

        Demo.reset();

        var cardWidth = 120;
        var cardHeight = 80;

        var wrapText = function(text, maxWidth) {
             var returnArray = [];
             var words = text.split(' ');
             var line = '';

             for(var n = 0; n < words.length; n++) {
               var testLine = line + words[n] + ' ';
               var metrics = c.measureText(testLine);
               var testWidth = metrics.width;
               if (testWidth > maxWidth && n > 0) {
                 returnArray.push(line);
                 line = words[n] + ' ';
               }
               else {
                 line = testLine;
               }
             }
             returnArray.push(line);
             return returnArray;
           }

        var p1 = Bodies.rectangle(100, 300, cardWidth, cardHeight, { frictionAir: 0.1, chamfer:10, render: {fillStyle:'#CC3333' }});
        var p2 = Bodies.rectangle(100, 300, cardWidth, cardHeight, { frictionAir: 0.1, chamfer:10, render: {fillStyle:'#CC3333' }});
        var s1 = Bodies.rectangle(200, 300, cardWidth, cardHeight, { frictionAir: 0.1, chamfer:10, render: {fillStyle:'#3333CC' }});
        var s2 = Bodies.rectangle(200, 300, cardWidth, cardHeight, { frictionAir: 0.1, chamfer:10, render: {fillStyle:'#3333CC' }});
        var s3 = Bodies.rectangle(200, 300, cardWidth, cardHeight, { frictionAir: 0.1, chamfer:10, render: {fillStyle:'#3333CC' }});
        var a1 = Bodies.rectangle(300, 300, cardWidth, cardHeight, { frictionAir: 0.1, chamfer:10, render: {fillStyle:'#33CC33' }});
        var a2 = Bodies.rectangle(300, 300, cardWidth, cardHeight, { frictionAir: 0.1, chamfer:10, render: {fillStyle:'#33CC33' }});


         var issueText = wrapText("issue text issue text issue text issue text issue text issue text", cardWidth - 25);
         var awesomeText = wrapText("definition of awesome definition of awesome", cardWidth - 25);
         var jiraText = wrapText("improvement steps", cardWidth - 25);

         p1.data = p2.data = issueText;
         s1.data = s2.data = s3.data = jiraText;
         a1.data = a2.data = awesomeText;

        var everything = Composite.create({bodies:[p1, p2, s1, s2, s3, a1, a2]});

        var bind = function(b1, b2){
            var c = Constraint.create({
                bodyA: b1,
                bodyB: b2,
                stiffness: 0.001,
                length: 150,
                render: {
                    lineWidth: 2,
                    strokeStyle: 'rgba(150,150,0,0.2)   '
                }
            });
            Composite.addConstraint(everything, c);
        };


        Events.on(_engine, 'afterTick', function(event) {
            var _boxes = Composite.allBodies(everything);
            c.font = "12px Arial";
            c.fillStyle = 'rgba(255, 255, 255, 0.8)';

            for(i = 0; i < _boxes.length; i++){
                Body.rotate(_boxes[i], -_boxes[i].angle * 0.2);
                for(t = 0; t < _boxes[i].data.length; t++){
                    c.fillText(_boxes[i].data[t], _boxes[i].position.x - cardWidth/2 + 5, _boxes[i].position.y - 25 + (t * 16), cardWidth);
                }
            }
            counter = 0;
        });



        bind(p1, s1);
        bind(p2, s1);

        bind(p2, s2);
        bind(s2, s3);
        bind(s3, a2);
        bind(s1, a1);

        World.add(_world, everything);

        var renderOptions = _engine.render.options;
        renderOptions.showShadows = true;
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
            Bodies.rectangle(400, -offset, 800.5 + 2 * offset, 50.5, { isStatic: true }),
            Bodies.rectangle(400, 600 + offset, 800.5 + 2 * offset, 50.5, { isStatic: true }),
            Bodies.rectangle(800 + offset, 300, 50.5, 600.5 + 2 * offset, { isStatic: true }),
            Bodies.rectangle(-offset, 300, 50.5, 600.5 + 2 * offset, { isStatic: true })
        ]);

        _mouseConstraint = MouseConstraint.create(_engine);
        World.add(_world, _mouseConstraint);

        var renderOptions = _engine.render.options;
        renderOptions.wireframes = false;
        renderOptions.hasBounds = false;
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