var container;
var camera, scene, renderer, projector;
var parent;

var controlsEnabled = true;

var innerColor = 0x0f8bff;
var outerColor = 0x000000;
var innerOpacity = 0.9;
var outerOpacity = 0.1;
var innerThickness = 2;
var outerThickness = 10;
var scale = 100;
var livePreviewSteps = 20;

var noStandaloneHelp = false;

var redrawArea = 5; // how many segments between the clicked one are redrawn
var stepIncrement = 4 // how many segments replace one old segment

var tapTolerance = 5;

var supportedOperations;
var helpDialog, savedDialog, exampleDialog;

var clock;
var cameraControls;
var grid = new Object();
var controlsVisible = true;
var showGrid = false;

var lastTap;

var graphActive = false;
var input = {};
var parsed = {};
var begin, end, step;

var addInProgress = false;

var variables = { A: 0.0, B: 0.0, C: 0.0 };

var tapSegments = [];

var inactiveGraphs = [];

var infinityIgnoredAlreadyShown = false;
var parserErrorAlreadyShown = false;
var lastParserError = false;

var cameraOffsetVector = new THREE.Vector3(1, 0.5, 0.2);
var cameraOffsetAngle = 0.2;

// variables used while drawing
var boundingBox;
var t;
var lastt;
var f;
var last;
var addParams = {};
// end: variables used while drawing

// camera movements
var positionDelta = new THREE.Vector3();
var targetDelta = new THREE.Vector3();
var remainingCameraSteps = 0;

var overwriteCurrentString = "This will overwrite your current graph. OK?";
var deleteConfirmationString = "There is no way to restore this curve again. Are you sure you want to delete it?"
	

///// variables used to track the used params

var nowParsing = 0;				// 0:=fX, 1:=fY, 2:=fZ
								// indicates the formula which is up next to be parsed (accessed in file parser.js!)
								
var params = new Array();		// stores the variables and params which are actually used in the current formulas

params[0] = new Array();		// vars and params of formula fX
params[1] = new Array();		// vars and params of formula fY
params[2] = new Array();		// vars and params of formula fZ

///// end: variables used to track the used params

function nextFunction()			// ensures 'nowParsing' is only assigned to  0, 1 or 2 (ring closure)
{
	nowParsing = (nowParsing < 2) ? (nowParsing+1) : (0);
}

function resetParamsList()		// deletes and rebuilds the params list to be used again with the next curve
{	
	params = new Array();
	params[0] = new Array();
	params[1] = new Array();
	params[2] = new Array();
}

function decideOnSliderAvailability()		// enables and disables sliders based on their occurrence in the formulas.
											// a parameter which does not occur in at least one of the formulas is not needed here
											// thus its slider is disabled
{
	 if(params[0].indexOf("a")==-1 && params[1].indexOf("a")==-1 && params[2].indexOf("a")==-1)
	 {	// check param 'a'
		 $("#varA").slider("disable");
	 }
	 else
	 {
		 $("#varA").slider("enable");
	 }
	 
	 if(params[0].indexOf("b")==-1 && params[1].indexOf("b")==-1 && params[2].indexOf("b")==-1)
	 {	// check param 'b'
		 $("#varB").slider("disable");
	 }
	 else
	 {
		 $("#varB").slider("enable");
	 }
	 
	 if(params[0].indexOf("c")==-1 && params[1].indexOf("c")==-1 && params[2].indexOf("c")==-1)
	 {	// check param 'c'
		 $("#varC").slider("disable");
	 }
	 else
	 {
		 $("#varC").slider("enable");
	 }
}


function bindButtons() {
    $("#saved").button().click(function () {
        savedDialog.dialog("open");
    });

    $("#examples").button().click(function () {
        exampleDialog.dialog("open");
    });

    $("#supportedLink").click(function (event) {
        event.preventDefault();
        supportedOperations.dialog("open");
    });

    $("#export").button().click(function () {
        if (!controlsEnabled)
            return;

        var url = renderer.domElement.toDataURL('image/png');
        window.open(url, 'screenshot');
    });

    $("#push").button().click(function () {
        if (!controlsEnabled)
            return;

        saveAndDisableGraph();
    });

    $("#pop").button().click(function () {
        if (!controlsEnabled)
            return;

        replaceGraph(inactiveGraphs.pop());
        updateCurveList();
    });

    $("#camera").button().click(function () {
        placeCamera();
    });

    $("#help").button().click(function () {
        if (window.navigator.standalone && noStandaloneHelp) {
            // we run in standalone mode
            openLinkExternal($("#helpFrame").attr("src"));
            return;
        }

        helpDialog.dialog("open");
    });

    $("#grid").button().click(function () {
        showGrid = !showGrid;
        grid.visible = showGrid;
    });
    $("#grid").click(); // executed once to show the grid by default

    $("#enter").button().click(function (e) {
        if (!controlsEnabled)
            return;

        draw();
    });
}

// initialize the document once it's ready
$(document).ready(function () {
    setupCacheEvents()

    clock = new THREE.Clock();

    $("#varA").slider({ value: 0.0, width: 100, slide: slideHandler("varA", "A"), stop: sliderStop, min: -10, max: 10, step: 0.1 });
    $("#varB").slider({ value: 0.0, width: 100, slide: slideHandler("varB", "B"), stop: sliderStop, min: -10, max: 10, step: 0.1 });
    $("#varC").slider({ value: 0.0, width: 100, slide: slideHandler("varC", "C"), stop: sliderStop, min: -10, max: 10, step: 0.1 });

    if (window.navigator.standalone) {
        // we run as a fullscreen web app
        $("#export").button().hide(); // no exporting
    }

    bindButtons();

    init();

    $("#begin").spinner({ value: 0 });
    $("#end").spinner({ value: 1 });
    $("#step").spinner({ value: 0.01, step: 0.01, min: 0 });

    supportedOperations = $("#supportedTokensDialog").dialog({ autoOpen: false, title: "Supported Functions and Constants", width: "80%" });
    helpDialog = $("#helpDialog").dialog({ autoOpen: false, title: "Documentation", width: "80%", height: window.innerHeight * 0.8 });
    savedDialog = $("#savedDialog").dialog({ autoOpen: false, title: "Saved Curves", width: "80%", height: "auto" });
    exampleDialog = $("#exampleDialog").dialog({ autoOpen: false, title: "Examples", width: "80%", height: "auto" });

    createExampleList();

    $('input').keypress(function (e) {
        if (controlsEnabled && e.which == 13) {		// check if 'enter' is pressed
            draw();
        }
    });

    $("#showhide")
	  .button({ icons: { primary: "arrow-up" } })
	  .click(function () {
	      var icn = (controlsVisible) ? "down" : "up";
	      $("#showhide").button("option", "icons", { primary: "arrow-" + icn});
	      $("#c_inner").slideToggle(200);
	      controlsVisible = !controlsVisible;
	  })
      .css({ height: 25, width: 25 });

    $('#infinityIgnored').click(alertInfinityIgnored);
    $('#parserError').click(alertParserError);
    $('#drawing').click(finishAddTubes);

    animate();
})

// enable or disable controls
function setControlsEnabled(enabled) {
    controlsEnabled = enabled;
    console.log("Controls enabled: " + enabled);
}

// sets a useful size
function setRecommendedSize() {
    var isiPad = navigator.userAgent.match(/iPad/i) != null;
    var width = window.innerWidth;

    if (width == 1024 && isiPad) {
        width = 1022;
    }

    container.css("width", width + "px");

    WINDOW_HEIGHT = window.innerHeight;

    renderer.setSize(width, WINDOW_HEIGHT);

    camera.aspect = width / WINDOW_HEIGHT;
    camera.updateProjectionMatrix();
}

function slideHandler(input, variable) {
    var update = function (e, ui) {
        variables[variable] = ui.value;
        $("#val" + variable).html(ui.value.toFixed(1));
        sliderMoved();
    }
    return update;
}

function sliderMoved() {
    if (graphActive) {
        // draw with limited accuracy
        clearScene();
        drawGraph(parsed.fX, parsed.fY, parsed.fZ, begin, end, (end - begin) / livePreviewSteps);
        render();
    }
}

function sliderStop() {
    draw();
}

function reSyncSliders() {
    $("#varA").slider("value", variables.A); $("#valA").html(variables.A);
    $("#varB").slider("value", variables.B); $("#valB").html(variables.B);
    $("#varC").slider("value", variables.C); $("#valC").html(variables.C);
}

// generates the saved curves window content
function updateCurveList() {
    if (inactiveGraphs.length === 0) {
        $("#saved").button("disable");
        if (savedDialog) savedDialog.dialog("close");
    }
    else {
        $("#saved").button("enable");
    }

    $("#curveList").html("");
    $(inactiveGraphs).each(function (index) {
        var cGraph = inactiveGraphs[index];
        var deleteLink = $("<a href='#'><img src='./src/delete.png' alt='delete' title='Delete saved curve'/></a>").button();
        deleteLink.click(function (e) {
            e.preventDefault();
            if (!confirm(deleteConfirmationString))
                return;

            deleteSegments(cGraph.tapSegments);
            inactiveGraphs.splice(index, 1);
            updateCurveList();
        });
        var restoreLink = $("<a href='#'><img src='./src/restore.png' alt='restore' title='Restore saved curve'/></a>").button();
        restoreLink.click(function (e) {
            e.preventDefault();
            savedDialog.dialog("close");
            replaceGraph(cGraph);
            inactiveGraphs.splice(index, 1);
            updateCurveList();
        });

        var el = $("<li>( " + cGraph.input.fX + ", " + cGraph.input.fY + ", " + cGraph.input.fZ + " ) </li>").prepend(deleteLink).prepend(" ").prepend(restoreLink);
        $("#curveList").append(el);
    })
}

function createExampleList() {
    $(examples).each(function (index) {
        var current = examples[index];
        var restoreLink = $("<a href='#'><img src='./src/restore.png' alt='try' title='Try this curve'/></a>").button();
        restoreLink.click(function (e) {
            e.preventDefault();
            if (graphActive) {
                if (!confirm(overwriteCurrentString)) {
                    return;
                }
            }
            $("#begin").val(current.begin);
            $("#end").val(current.end);
            $("#step").val(current.step);
            $("#fX").val(current.fX);
            $("#fY").val(current.fY);
            $("#fZ").val(current.fZ);
            exampleDialog.dialog("close");
            draw();
        });
        var el = $("<li> " + current.name + "</li>");
        el.prepend(restoreLink);

        $("#exampleList").append(el);
    });
}

// make sure a user is aware of his current graph to be deleted
function replaceGraph(graph) {
    if (graphActive) {
        if (!confirm(overwriteCurrentString)) {
            return;
        }
    }

    restoreGraph(graph);
}

function replaceByMathName(formula, fun) {
    var r = "";
    $(fun.split('')).each(function (index) {
        var ch = fun.substring(index, index + 1);
        r += "[" + ch.toLowerCase() + ch.toUpperCase() + "]";
    });

    return formula.replace(new RegExp(r, 'g'), fun);
}

function preprocess(formula) {
    var names = ["sin", "cos", "tan", "asin", "acos", "atan", "sqrt", "log", "abs", "ceil", "floor", "round", "exp", "random", "fac", "min", "max", "pyt", "pow", "atan2", "PI"];
    $(names).each(function (i) {
        formula = replaceByMathName(formula, names[i]);
    });
    return formula;
}

// draws a graph based on the current user input
function draw() {
    /* Make sure you take the right input and preprocess it. */

    input.fX = preprocess($("#fX").val());
    input.fY = preprocess($("#fY").val());
    input.fZ = preprocess($("#fZ").val());
    
    resetParamsList();
    
    try {
    	
    	
        parsed.fX = Parser.parse(input.fX);
        nextFunction();
        parsed.fY = Parser.parse(input.fY);
        nextFunction();
        parsed.fZ = Parser.parse(input.fZ);
        nextFunction();
        
    } catch (e) {
        warnParserError(e.message);
        return;
    }
    
    
    decideOnSliderAvailability();
    
    updateCurveList();

    begin = parseFloat($("#begin").val());
    end = parseFloat($("#end").val());
    step = parseFloat($("#step").val());

    clearScene();

    if (step <= 0) { alert("Please enter a reasonable step size."); return; };
    drawGraph(parsed.fX, parsed.fY, parsed.fZ, begin, end, step);
    graphActive = true;
}

// draws a graph using new (and cool) tubes
function drawGraph(fX, fY, fZ, begin, end, step) {
    segments = [];
    addTubes(fX, fY, fZ, begin, end, step);
}

// gives a recommended camera position
function recommendViewPoint(bBox) {
    var recommendation = new THREE.Vector3(1, 1, 1);
    var center = bBox.center();

    if (center.length() > 10) { //only if the center is not (very) near to the middle
        recommendation.copy(center).normalize();
    }

    // guess a distance
    var dist = center.length() + bBox.size().length()*1.5;
    dist = Math.min(dist, 2000);
    recommendation.multiplyScalar(dist);

    // rotate the vector a little bit, to make sure we don't look directly into a tube
    var matrix = new THREE.Matrix4().makeRotationAxis(cameraOffsetVector, cameraOffsetAngle);
    recommendation.applyProjection(matrix);
    
    return recommendation;
}

// adds tubes to draw a graph, can also be used to (re-)draw a part of a graph
function addTubes(fX, fY, fZ, start, end, step) {
    $('#drawing').stop(true, true);
    $('#drawing').fadeIn(500);

    boundingBox = new THREE.Box3();

    addParams = { start: start, end: end, step: step };

    t = addParams.start;
    lastt = addParams.start;
    f = function (t) {
        return new THREE.Vector3(
        scale * fX.evaluate({ t: t, a: variables.A, b: variables.B, c: variables.C }),
        scale * fY.evaluate({ t: t, a: variables.A, b: variables.B, c: variables.C }),
        scale * fZ.evaluate({ t: t, a: variables.A, b: variables.B, c: variables.C }));
    };
    try {
        last = f(t);

        if (!isFinite(last.x) || !isFinite(last.y) || !isFinite(last.z)) {
            warnInfinityIgnored();
            last = f(t + 0.1);
        }
    }
    catch (e) {// possible exceptions:
        //	UndefinedVariableException, NotAFunctionException, InvalidExpressionException, ParsingException (most general if error is unknown)

        // the message contains the details of the parsing error
        warnParserError(e.message);
        $('#drawing').fadeOut(500);
        return; // no error screen. No graph will be drawn but the grid remains (if its toggled)
    }

    boundingBox.expandByPoint(last);
    addInProgress = true;

    setControlsEnabled(false);
    continueAddTubes();
}

// needs to be called continously until drawing is finished
function continueAddTubes() {
    var limit = 100;

    while (t < addParams.end && limit > 0) {
        t = t + addParams.step;
        if (t > addParams.end) { t = addParams.end; };

        var next = f(t);

        if (!isFinite(next.x) || !isFinite(next.y) || !isFinite(next.z)) {
            warnInfinityIgnored();
            last = next;
            lastt = t;
            continue;

        }

        boundingBox.expandByPoint(next);

        var curve = new THREE.LineCurve3(last, next);

        var innerGeometry = new THREE.TubeGeometry(curve, 1, innerThickness, 4, false);
        innerGeometry.dynamic = true;
        var innerMesh = new THREE.Mesh(innerGeometry, new THREE.MeshBasicMaterial({ color: innerColor, opacity: innerOpacity, transparent: true }));

        var outerGeometry = new THREE.TubeGeometry(curve, 1, outerThickness, 4, false);
        outerGeometry.dynamic = true;
        var outerMesh = new THREE.Mesh(outerGeometry, new THREE.MeshBasicMaterial({ color: outerColor, opacity: outerOpacity, transparent: true }));

        scene.add(innerMesh);
        scene.add(outerMesh);

        // register segments
        outerMesh.begin = lastt;
        outerMesh.end = t;
        outerMesh.step = addParams.step;
        outerMesh.inner = innerMesh;
        innerMesh.outer = outerMesh;
        tapSegments.push(outerMesh);

        last = next;
        lastt = t;
        limit--;
    }

    if (t >= addParams.end) { finishAddTubes(); }
}

// finish drawing
function finishAddTubes() {
    $('#drawing').fadeOut(500);
    addInProgress = false;
    setControlsEnabled(true);
}

function placeCamera() {
    var newPosition = recommendViewPoint(boundingBox);
    var newTarget = boundingBox.center()
    if (boundingBox.center().length() < 500) { // try to center the middle
        newTarget = new THREE.Vector3(0, 0, 0);
    }

    console.log("Moving to (" + newPosition.x + ", " + newPosition.y + ", " + newPosition.z + ") targeting (" + newTarget.x + ", " + newTarget.y + ", " + newTarget.z + ").");

    smoothMoveCameraTo(newPosition, newTarget);
}

function smoothMoveCameraTo(newPosition, newTarget) {
    var smoothness = 75;

    positionDelta = new THREE.Vector3().subVectors(newPosition, camera.position).divideScalar(smoothness);
    targetDelta = new THREE.Vector3().subVectors(newTarget, cameraControls.target).divideScalar(smoothness);

    remainingCameraSteps = smoothness;
}

// initialize the scene
function init() {
    $("#wrapper").append('<div id="container"> </div>');
    container = $("#container");

    // allow clicking on tubes
    document.getElementById("container").addEventListener('click', onDocumentClick, false);
    document.getElementById("container").addEventListener('touchstart', onDocumentTouchStart, false);

    projector = new THREE.Projector();

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.x = 300;
    camera.position.y = 100;
    camera.position.z = 300;

    scene = new THREE.Scene();

    // Grid

    var size = 1500, step = 150;

    var geometry = new THREE.Geometry();

    for (var i = -size; i <= size; i += step) {

        geometry.vertices.push(new THREE.Vector3(-size, 0, i));
        geometry.vertices.push(new THREE.Vector3(size, 0, i));

        geometry.vertices.push(new THREE.Vector3(i, 0, -size));
        geometry.vertices.push(new THREE.Vector3(i, 0, size));

    }

    for (var i = -size; i <= size; i += step) {
        geometry.vertices.push(new THREE.Vector3(-size, i, 0));
        geometry.vertices.push(new THREE.Vector3(size, i, 0));
        geometry.vertices.push(new THREE.Vector3(i, -size, 0));
        geometry.vertices.push(new THREE.Vector3(i, size, 0));
    }

    for (var i = -size; i <= size; i += step) {
        geometry.vertices.push(new THREE.Vector3(0, -size, i));
        geometry.vertices.push(new THREE.Vector3(0, size, i));
        geometry.vertices.push(new THREE.Vector3(0, i, -size));
        geometry.vertices.push(new THREE.Vector3(0, i, size));
    }


    var material = new THREE.LineBasicMaterial({ color: 0x000000, opacity: 0.2 });

    grid = new THREE.Line(geometry, material);
    grid.type = THREE.LinePieces;
    grid.visible = showGrid;
    scene.add(grid);

    parent = new THREE.Object3D();
    parent.position.y = 100;
    scene.add(parent);

    renderer = new THREE.CanvasRenderer();

    setRecommendedSize();

    $(window).resize(setRecommendedSize);

    $(renderer.domElement).click(function () {
        $(document.activeElement).blur();
    });

    cameraControls = new THREE.TrackballControls(camera, renderer.domElement);
    cameraControls.target.set(0, 50, 0);
    camera.lookAt(scene.position);

    draw();

    container.append(renderer.domElement);
}

// removes everything from the scene which is part of a graph
function clearScene() {
    deleteSegments(tapSegments);
    tapSegments = [];
}

function animate() {
    requestAnimationFrame(animate);
    render();
}

// here we enable rotations, translations and
function render() {
    if (addInProgress) {
        continueAddTubes();
    }

    if (remainingCameraSteps > 0) {
        remainingCameraSteps--;
        camera.position.add(positionDelta);
        cameraControls.target.add(targetDelta);
    }

    var delta = clock.getDelta();
    cameraControls.update(delta);

    renderer.render(scene, camera);
}


// processes clicks to the main canvas
function onDocumentClick(event) {
    event.preventDefault();

    handleClickTap(event.clientX, event.clientY);
}

function onDocumentTouchStart(event) {
    document.getElementById("container").removeEventListener('touchstart', onDocumentTouchStart, false);
    lastTap = { clientX: event.touches[0].clientX, clientY: event.touches[0].clientY };
    document.getElementById("container").addEventListener('touchmove', onDocumentTouchMove, false);
    document.getElementById("container").addEventListener('touchend', onDocumentTouchEnd, false);
}
function onDocumentTouchEnd(event) {
    document.getElementById("container").removeEventListener('touchend', onDocumentTouchEnd, false);
    document.getElementById("container").removeEventListener('touchmove', onDocumentTouchMove, false);
    document.getElementById("container").addEventListener('touchstart', onDocumentTouchStart, false);

    handleClickTap(lastTap.clientX, lastTap.clientY);
}
function onDocumentTouchMove(event) {
    // document.title = "X: " + event.touches[0].clientX + "   Y: " + event.touches[0].clientX + "   sX: " + lastTap.clientX + "   sY: " + lastTap.clientY;

    if (Math.abs(event.touches[0].clientX - lastTap.clientX) > tapTolerance || Math.abs(event.touches[0].clientY - lastTap.clientY) > tapTolerance) {
        document.getElementById("container").removeEventListener('touchend', onDocumentTouchEnd, false);
        document.getElementById("container").addEventListener('touchstart', onDocumentTouchStart, false);
    }
}

// process a click / tap to the given coordinate
function handleClickTap(clientX, clientY) {
    var vector = new THREE.Vector3((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1, 0.5);

    projector.unprojectVector(vector, camera);

    var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());

    var intersects = raycaster.intersectObjects(tapSegments, true);

    if (intersects.length > 0) {
        var segment = intersects[0].object;
        reDrawPart(segment.begin - segment.step * redrawArea, segment.end + segment.step * redrawArea, segment.step / stepIncrement);
    }
}

// re-draws part of the graph with the specified step-size
function reDrawPart(start, end, newStep) {
    var actual = removePart(start, end);
    addTubes(parsed.fX, parsed.fY, parsed.fZ, actual.start, actual.end, newStep);
}

// deletes all parts of the graph within the given interval
// if tubes are partially within the interval, they will be removed, too
// returns the actual boundaries of the created gap
// please make sure there is at least one part within the interval!
function removePart(start, end) {
    var actualStart = Infinity;
    var actualEnd = -Infinity;

    var segment, i;
    for (i = tapSegments.length - 1; i >= 0 ; i--) {
        segment = tapSegments[i];

        if (within(segment.begin, start, end) || within(segment.end, start, end)) {
            scene.remove(segment.inner);
            scene.remove(segment);
            tapSegments.splice(i, 1);
            actualStart = Math.min(actualStart, segment.begin);
            actualEnd = Math.max(actualEnd, segment.end);
        }
    }

    return { start: actualStart, end: actualEnd };
}

// returns whether x is in the given interval
function within(x, start, end) {
    return (x > start && x < end);
}

// remove the currently active graph, converting it to an inactive graph und saving it
function saveAndDisableGraph() {
    if (!graphActive) {
        alert("We couldn't save a graph. Draw one to continue.");
        return;
    }

    $('#drawing').fadeIn(500);

    var color = Math.random() * 0xffffff;

    var graphData = { input: input, parsed: parsed, tapSegments: tapSegments, begin: begin, end: end, step: step, infinity: infinityIgnoredAlreadyShown, variables: variables, params: params };
    input = {};
    parsed = {};
    variables = { A: 0.0, B: 0.0, C: 0.0 };
    reSyncSliders();
    resetParamsList();				// resets the params list to be filled again the next time a graph is drawn or restored			
    decideOnSliderAvailability();	// disables all sliders as the params list has been cleared right before

    for (i = tapSegments.length - 1; i >= 0 ; i--) {
        segment = tapSegments[i];
        segment.visible = false;
        segment.inner.material.color.setHex(color);
    }

    tapSegments = [];

    graphActive = false;

    $("#fX").val("");
    $("#fY").val("");
    $("#fZ").val("");

    inactiveGraphs.push(graphData);

    updateCurveList();

    render();
    $('#drawing').fadeOut(500);
}

// load a disabled graph, making it active
function restoreGraph(graphData) {
    $('#drawing').fadeIn(500);

    clearScene();

    input = graphData.input;
    parsed = graphData.parsed;
    tapSegments = graphData.tapSegments;
    begin = graphData.begin;
    end = graphData.end;
    step = graphData.step;
    variables = graphData.variables;
    params = graphData.params;			// restores the list of actually used variables and parameters

    
    decideOnSliderAvailability();		// based on the updated array 'params' of the restoredGraph
    
    reSyncSliders();

    for (i = tapSegments.length - 1; i >= 0 ; i--) {
        segment = tapSegments[i];
        segment.visible = true;
        segment.inner.material.color.setHex(innerColor);
    }

    graphActive = true;

    $("#fX").val(input.fX);
    $("#fY").val(input.fY);
    $("#fZ").val(input.fZ);
    $("#begin").val(begin);
    $("#end").val(end);
    $("#step").val(step);

    render();
    if (graphData.infinity) {
        warnInfinityIgnored();
    }
    $('#drawing').fadeOut(500);
}

// listen for update event
function setupCacheEvents() {
    if (window.applicationCache != undefined && window.applicationCache != null) {
        window.applicationCache.addEventListener('updateready', updateApplication);
        window.applicationCache.addEventListener("progress", progressCache, false);
        window.applicationCache.addEventListener("cached", doneCache, false);
        window.applicationCache.addEventListener("noupdate", noupdateCache, false);
        window.applicationCache.addEventListener("error", errorCache, false);
    }
}

// http cache update
function updateApplication(event) {
    if (window.applicationCache.status != 4) return;
    window.applicationCache.removeEventListener('updateready', updateApplication);
    window.applicationCache.swapCache();

    window.location.reload();
}

function noupdateCache() {
    console.log("No update to cache found");
    $('#cacheLoading').fadeOut(1000);
}

function doneCache() {
    console.log("Cache has finished downloading");
    $('#cacheLoading').fadeOut(1000);
}

function progressCache() {
    console.log("Downloading cache...");
    $('#cacheLoading').fadeIn(1000);
}

function errorCache() {
    console.log("You're either offline or something has gone horribly wrong.");
    $('#cacheLoading').fadeOut(1000);
}

// show "infinity ignored"
function warnInfinityIgnored() {
    if (!infinityIgnoredAlreadyShown) {
        infinityIgnoredAlreadyShown = true;
        $('#infinityIgnored').fadeIn(1000);
        setTimeout(function () {
            $('#infinityIgnored').fadeOut(2000);
            setTimeout(function () {
                infinityIgnoredAlreadyShown = false;
            }, 5000);
        }, 5000);
    }
}

// show explaining alert for "infinity ignored"
function alertInfinityIgnored() {
    alert("Infinity occured during calculation. The value was ignored.");
}

// show "parser error"
function warnParserError(message) {
    lastParserError = message;
    if (!parserErrorAlreadyShown) {
        parserErrorAlreadyShown = true;
        $('#parserError').fadeIn(1000);
        setTimeout(function () {
            $('#parserError').fadeOut(2000);
            setTimeout(function () {
                parserErrorAlreadyShown = false;
            }, 3000);
        }, 5000);
    }
}

// show last parser error
function alertParserError() {
    alert(lastParserError);
}

// removes all segments on this list from the scene
function deleteSegments(segments) {
    var obj, i;
    for (i = segments.length - 1; i >= 0 ; i--) {
        obj = segments[i];
        scene.remove(obj.inner);
        scene.remove(obj);
    }
}

// opens a link, busting out of standalone mode
function openLinkExternal(link) {
    var a = document.createElement('a');
    a.setAttribute("href", link);
    a.setAttribute("target", "_blank");

    var dispatch = document.createEvent("HTMLEvents")
    dispatch.initEvent("click", true, true);
    a.dispatchEvent(dispatch);
}