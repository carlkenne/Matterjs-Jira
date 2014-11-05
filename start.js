c = "";
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
            render: {options: {width: 1200, height: 700}},
            world: {bounds: {max: { x: 2400, y: 1400 }}},
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

    Demo.toyotaKata = function() {
        var _world = _engine.world;
        c = _engine.render.context;
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
            }).first();

            var fillstyle = cardType.fillStyle;
            if(!card.active){
                fillstyle = cardType.fillStyleInactive;
            }

            var body = Bodies.rectangle(cardType.row, y * scale, cardWidth, cardHeight, { frictionAir: cardType.frictionAir, chamfer: 10, render: { fillStyle: fillstyle }});
            body.data = card;
            body.render.originalStrokeStyle = body.render.strokeStyle = 'rgba(40, 40, 40, 1)';
            console.log(body.render.strokeStyle);
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
                    strokeStyle: 'rgba(150,150,0,0.4)'
                }
            });
            Composite.addConstraint(everything, c);
        };

        var getBodyBy = function(id){
            return bodies.filter(function(body) {
                return body.data.id == id;
            }).first()
        }

        var bindLinkedBodies = function(links) {
            for(var i = 0; i < links.length; i++) {
                for(var n = 0; n < links[i].nextSteps.length; n++) {
                    var from = getBodyBy(links[i].nextSteps[n][0]);
                    var to = getBodyBy(links[i].nextSteps[n][1]);
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

        var getIdsPointingTo = function(id){
            return links.selectMany(function(x) {
                return x.nextSteps;
            }).filter(function(c){
                return c[1] == id;
            }).map(function(c){
                return c[0];
            });
        }

        var getIdsPointingFrom = function(id){
            return links.selectMany(function(x) {
                return x.nextSteps;
            }).filter(function(c) {
                return c[0] == id;
            }).map(function(c) {
                return c[1];
            });
        }

        var getCardsPointingTo = function(id){
            return getIdsPointingTo(id).map(function(_id){
                return getCardBy(_id);
            })
        }
        var createdIds = [];
        var y = 1;

        var createCardsFromLinks = function(links){
            links.forEach(function(link) {
                createCard(link.issue);
                createCard(link.awesome);

                var all = link.nextSteps.selectMany(function(x) { return x; });
                all.forEach(function(id){
                    if(createdIds.indexOf( id ) == -1) {
                        var card = getCardBy(id);
                        card.active = getCardsPointingTo(id)
                            .filter(function(t) {
                                return t.type == "nextStep" && t.fields.status != "closed";
                            }).length == 0;
                        bodies.push(createBody(card, y));
                        createdIds.push(id);
                    }
                });
                y++;
            });
        }

        var createCard = function(id){
            var card = getCardBy(id);
            bodies.push(createBody(card, y));
            createdIds.push(id);
        }

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

        Demo.reset();

        var links = getLinks();
        var cards = getCards().concat(getNextStepsFromJira());

        createCardsFromLinks(links);

        // - - - - - Highlighting
        var toTransparent = function(body){
            body.render.fillStyle = body.render.fillStyle.replace(", 1)",", 0.3)");
            body.render.strokeStyle = body.render.strokeStyle.replace(", 1)",", 0.3)");
        }

        var everythingTransparent = function() {
            bodies.forEach(function(body){
                toTransparent(body);
            });
        }

        var toSolid = function(body) {
            body.render.fillStyle = body.render.fillStyle.replace(", 0.3)",", 1)");
            body.render.strokeStyle = body.render.strokeStyle.replace(", 0.3)",", 1)");
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

        var getAllConnectedCards = function(id) {
            var all = getIdsRecursivlyPointingTo(id)
                .concat(getIdsRecursivlyPointingFrom(id))
                .map(function(_id) {
                    return getCardBy(_id);
                });
            return all;
        }

        var getIdsRecursivlyPointingTo = function(id){
            return getIdsPointingTo(id)
                .selectMany(function(_id) {
                    return getIdsRecursivlyPointingTo(_id);
                }).concat(id);
        }

        var getIdsRecursivlyPointingFrom = function(id){
            return getIdsPointingFrom(id)
                .selectMany(function(_id) {
                    return getIdsRecursivlyPointingFrom(_id);
                }).concat(id);
        }
        var translate = {
            x:0,
            y:0
        }

        Events.on(_engine, 'mouseup', function(event) {
            var _translatex = (_engine.render.options.width/2) - event.mouse.position.x;
            var _translatey = (_engine.render.options.height/2) - event.mouse.position.y;
            _translatex = Math.max(translate.x + _translatex, -_engine.render.options.width) - translate.x;
            _translatex = Math.min(translate.x + _translatex, 0) - translate.x;
            _translatey = Math.max(translate.y + _translatey, -_engine.render.options.height) - translate.y;
            _translatey = Math.min(translate.y + _translatey, 0) - translate.y;
            translate.y += _translatey;
            translate.x += _translatex;
            console.log(_translatex);
            c.translate(_translatex,_translatey);
        });

        Events.on(_engine, 'mousemove', function(event) {
            var pos = event.mouse.position;
//            pos.x = event.mouse.position.x / 0.5 ;
//            pos.y = event.mouse.position.y / 0.5;

            Query.ray(bodies, pos, { x:pos.x + 1, y:pos.y + 1 })
                .empty(function(){
                    setSolidOn(bodies);
                })
                .first(function(hit) {
                    console.log(hit.body.data.title);
                    var show = !hit.body.render.hasHighlight;
                    everythingTransparent();

                    if(show){
                        getAllConnectedCards(hit.body.data.id)
                            .map(function(c) {
                                var body = getBodyBy(c.id);
                                toSolid(body);
                            });
                    }
                });

        });

        // - - - - - - - - - - - -

        Events.on(_engine, 'afterTick', function(event) {
            c.font = "12px Arial";
            c.fillStyle = 'rgba(255, 255, 255, 0.8)';

            Composite.allBodies(everything).forEach(function(box){
                Body.rotate(box, -box.angle * 0.2);
                for(t = 0; t < box.data.title.length; t++){
                    c.fillText(box.data.title[t], box.position.x - cardWidth/2 + 5, box.position.y - 25 + (t * 16), cardWidth);
                }
            });
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
            Bodies.rectangle((_world.bounds.max.x)/2, -offset, (_world.bounds.max.x) + 2 * offset, 50.5, { isStatic: true }),
            Bodies.rectangle((_world.bounds.max.x)/2, (_world.bounds.max.y) + offset, (_world.bounds.max.x) + 2 * offset, 50.5, { isStatic: true }),
            Bodies.rectangle((_world.bounds.max.x) + offset, (_world.bounds.max.y/2), 50.5, (_world.bounds.max.y) + 2 * offset, { isStatic: true }),
            Bodies.rectangle(-offset, (_world.bounds.max.y/2), 50.5, (_world.bounds.max.y) + 2 * offset, { isStatic: true })
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