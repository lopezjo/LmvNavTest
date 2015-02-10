

function testAsync2() {
    
    var leafNodes = getLeafNodeObjs();
    console.log("\nLEAF NODES: " + leafNodes.length);   // NOTE: Leaf nodes always is correct

        // for each leaf node, find out what Material bucket this object goes in
    var promises = [];
    $.each(leafNodes, function(num, dbId) {
        promises.push(function() {
            console.log("promise: " + num);
        });
    });
    $.when.apply($, promises).then(function() {
        console.log("All done");
    }, function() {
        console.log("Error happened!");
    });
}


/*  START:  raw test of jQuery Promise/Deferred.  This is called from "Test Async" button on page
        NOTE:  it seems to work in the correct order, but I do notice a weird behavior.  When I use an anonymous
               function for the when.apply().then() statement, it doesn't execute.  But, calling a declared function
               does.  All examples on Google use an anonymous function, so that should work!
*/
function foo(i, cb) {
    console.log("FOO: " + i);
}

function testAsync() {
    var promises = [];
    function createPromise() {
        var p = $.Deferred();
        promises.push(p);
        //return function() { p.resolve(); };
        return p.resolve; // Doesn't create an anonymous function
    };
    for (var i = 0; i < 3; i++) {
         foo(i, createPromise());
    }
    $.when.apply($, promises).then(signalDone("Finite!"));
}

function signalDone(str) {
    alert(str);
}

/*  END: raw test of jQuery Promise/Deferred */


/*  START: attempt to make it work for the Properties */

function getPropsAsync(dbId, propNameStr, pieData) {
    _viewerMain.getProperties(dbId, function(data) {
        console.log("workingo on dbID: " + dbId);
        if ((data.properties === null) || (data.properties.length === 0)) {
            console.log("There are no properties for this node.");
            return;
        }
        for (var j=0; j<data.properties.length; j++) {
            var obj = data.properties[j];
            if (obj.displayName === propNameStr) {
                console.log("found property");
                var index = getPropBucket(pieData.content, obj.displayValue);
                var tmpObj = pieData.content[index];
                tmpObj.value++;  // bump the count
                tmpObj.lmvIds.push(data.dbId);   // add the LMV dbID
            }
        }
    });
}

    // iterate through all the leaf node objects of the ModelStructure tree and sort into "buckets"
    // based on some Property Name (eg "Material")
function getLmvObjDataMat(propNameStr, callbackFunc) {
    var pieData = {
        "sortOrder": _sortOrder,
        "content": []
    };
    
    var leafNodes = getLeafNodeObjs();
    console.log("\nLEAF NODES: " + leafNodes.length);   // NOTE: Leaf nodes always is correct

        // for each leaf node, find out what Material bucket this object goes in
    var promises = [];
    function createPromise() {
        var p = $.Deferred();
        promises.push(p);
        return p.resolve; // Doesn't create an anonymous function
    };
    $.each(leafNodes, function(num, dbId) {
        getPropsAsync(dbId, propNameStr, pieData);
    });
    $.when.apply($, promises).then(allDone(pieData));
}

function allDone(pieData) {
    alert("all done");
     console.log("Buckets: %O", pieData.content);
}


    // iterate through all the leaf node objects of the ModelStructure tree and sort into "buckets"
    // based on some Property Name (eg "Material")
function getLmvObjDataMatBruteForce(propNameStr, callbackFunc) {
    var pieData = {
        "sortOrder": _sortOrder,
        "content": [],
    };
    
    pieData.leafNodes = getLeafNodeObjs();
    pieData.visitedLeafNodes = 0;
    console.log("\nLEAF NODES: " + pieData.leafNodes.length);   // NOTE: Leaf nodes always is correct

        // for each leaf node, find out what Material bucket this object goes in
    $.each(pieData.leafNodes, function(num, dbId) {
        _viewerMain.getProperties(dbId, function(data) {
            if ((data.properties === null) || (data.properties.length === 0)) {
                console.log("There are no properties for this node.");
                return;
            }
            for (var j=0; j<data.properties.length; j++) {
                var obj = data.properties[j];
                if (obj.displayName === propNameStr) {
                    var index = getPropBucket(pieData.content, obj.displayValue);
                    var tmpObj = pieData.content[index];
                    tmpObj.value++;  // bump the count
                    tmpObj.lmvIds.push(data.dbId);   // add the LMV dbID
                }
            }
            pieData.visitedLeafNodes++;
        });
    });
    while (pieData.visitedLeafNodes != pieData.leafNodes) {
        console.log("waiting...");
    }
    console.log("Buckets: %O", pieData.content);
    if (callbackFunc)
        callbackFunc(pieData);
}

    // get the bucket object that already exists, or create a new one and return the index
function getPropBucket(buckets, valueStr) {
    for (var i=0; i<buckets.length; i++) {
        if (buckets[i].label === valueStr)
            return i;
    }
        // doesn't exist, so add it
    var bucketObj = {};
    bucketObj.label = valueStr;
    bucketObj.value = 0;
    bucketObj.lmvIds = [];
    
    buckets.push(bucketObj);
    return buckets.length - 1;
}



function clickPieWedgeMaterial(evt) {
    _viewerMain.isolateById(evt.data.lmvIds);
    //_viewerSecondary.select(evt.data.lmvIds);
    workaround_2D_select(evt.data.lmvIds);
}


function getLeafNodeObjs() {
    var leafNodes = [];
    
    _viewerMain.getObjectTree(function(objTree) {
        $.each(objTree.children, function(num, treeNode) {
            recursiveGetLeafNodes(treeNode, leafNodes);
        }); 
     });
    
    return leafNodes;
}

    // recursively add all the leaf nodes
function recursiveGetLeafNodes(treeNode, leafNodes) {
    if (!treeNode.children) {
        leafNodes.push(treeNode.dbId);
        return;
    }
    else {
        $.each(treeNode.children, function(num, treeNode2) {
            recursiveGetLeafNodes(treeNode2, leafNodes);
        });
    }
}