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
        var cardWidth = 120;
        var cardHeight = 80;
        var cardTextWidth = cardWidth - 25;
        var nextStepsRow = 200;
        var cardTypes = [
            {fillStyle:'#CC7777', row: 100, type: 'issue', frictionAir: 0.7},
            {fillStyle:'#7777CC', row: 400, type: 'nextStep', frictionAir: 0.01},
            {fillStyle:'#77CC77', row: 700, type: 'awesome', frictionAir: 0.7 }
        ];
        var bodies = [];

        var wrapText = function(text) {
            var returnArray = [];
            var words = text.split(' ');
            var line = '';

            for(var n = 0; n < words.length; n++) {
                var testLine = line + words[n] + ' ';
                var metrics = c.measureText(testLine);
                var testWidth = metrics.width;
                if (testWidth > cardTextWidth && n > 0) {
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

        var createBody = function(card, scale) {
            var cardType = cardTypes.filter(function(item) {
               return item.type == card.type;
            })[0];

            var body = Bodies.rectangle(cardType.row, y * scale, cardWidth, cardHeight, { frictionAir: cardType.frictionAir, chamfer: 10, render: { fillStyle: cardType.fillStyle }});
            body.data = card;
            body.data.title = wrapText(card.fields.summary);
            body.data.body = wrapText(card.fields.issuetype.description);
            return body;
        }

        var bindBodies = function(from, to){
            var c = Constraint.create({
                bodyA: from,
                bodyB: to,
                stiffness: 0.001,
                length: 150,
                render: {
                    lineWidth: 2,
                    strokeStyle: 'rgba(150,150,0,0.4)   '
                }
            });
            Composite.addConstraint(everything, c);
        };

        var bindLinkedBodies = function(links) {
            for(var i = 0; i < links.length; i++) {
                for(var n = 0; n < links[i].nextSteps.length; n++) {
                    var from = bodies.filter(function(body) {
                        return body.data.id == links[i].nextSteps[n][0];
                    })[0];
                    var to = bodies.filter(function(body) {
                        return body.data.id == links[i].nextSteps[n][1];
                    })[0];
                    bindBodies(from, to);
                }
            }
        }
        var getCardBy = function(id){
            return cards.filter(function(card){ return card.id == id})[0];
        }

        Array.prototype.selectMany = function(fn) {
            return this.map(fn)
                .reduce(function(x,y) {
                    return x.concat(y);
                },[]);
        };


        var createCard = function(id){
            var card = getCardBy(id);
            bodies.push(createBody(card, y));
            createdIds.push(id);
        }
        var createdIds = [];
        var y = 1;

        var createCardsFromLinks = function(links){
            for(var i = 0; i < links.length; i++) {
                createCard(links[i].issue);
                createCard(links[i].awesome);

                var all = links[i].nextSteps.selectMany(function(x) { return x; });

                for(var j = 0; j < all.length; j++){
                    if(createdIds.indexOf( all[j] ) == -1) {
                        createCard(all[j]);
                    }
                }
                y++;
            }
        }

        Demo.reset();

        var links = getLinks();
        var cards = getCards().concat(getNextStepsFromJira());

        createCardsFromLinks(links);



        Events.on(_engine, 'afterTick', function(event) {
            var _boxes = Composite.allBodies(everything);
            c.font = "12px Arial";
            c.fillStyle = 'rgba(255, 255, 255, 0.8)';

            for(i = 0; i < _boxes.length; i++){
                Body.rotate(_boxes[i], -_boxes[i].angle * 0.2);
                for(t = 0; t < _boxes[i].data.title.length; t++){
                    c.fillText(_boxes[i].data.title[t], _boxes[i].position.x - cardWidth/2 + 5, _boxes[i].position.y - 25 + (t * 16), cardWidth);
                }
            }
            counter = 0;
        });

        var everything = Composite.create({bodies:bodies});
        World.add(_world, everything);
        bindLinkedBodies(links);
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