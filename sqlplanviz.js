//
// .SqlPlan visualizer
// Copyright (c) 2013, Chris Sammis
// All contents released under the MIT license, http://opensource.org/licenses/MIT
//

(function () {

    var INDENT_DIFF = 1.0;
    var REGEXP_COLS = /\[(.+?)\]/;

    var statementCost = 0.0;

    var processStatement = function(node)
    {
        var $node = $(node);

        $("#plan").empty();
        $("<div>").addClass("StatementText").text($node.attr("StatementText")).appendTo("#plan");

        statementCost = $node.attr("StatementSubTreeCost");

        var lastDepth = 0;
        var lastDepthEm = 0;
        $node.find("RelOp").each(function (index, relop)
        {
            var $relop = $(relop);

            var depth = $relop.parents().length;
            lastDepthEm += (depth > lastDepth) ?      INDENT_DIFF :
                           (depth < lastDepth) ? -1 * INDENT_DIFF : 0;
            lastDepth = depth;

            $("#plan").append(getRelOpDetails($relop, index, lastDepthEm)); 
        });
    };

    var getRelOpDetails = function($relop, index, indention)
    {
        var $relopDiv = $("<div>").css("padding-left", (indention - INDENT_DIFF) + "em");
        $relopDiv.addClass("RelOp").addClass("RelOp_" + index);
        
        var physOp = $relop.attr("PhysicalOp");
        var logop = $relop.attr("LogicalOp");
        
        // **** TOP
        if (physOp == "Top")
        {
            $relop.find("Top > TopExpression > ScalarOperator > Const").first().each(
                    function (index, constNode) { logop += " " + constNode.getAttribute("ConstValue"); });
        }
        $relopDiv.append(" \u21B3 ").append($("<span>").addClass("LogicalOp").text(logop));

        // **** SORT
        if (physOp == "Sort")
        {
            $relop.find("ColumnReference").first().each(function (index, sortNode)
                {
                    $relopDiv.append(" on ").append(
                        $("<span>").addClass("ColumnReference").text(getReferences(sortNode, "Column")));
                });
        }

        // **** INDEX SEEK/SCAN
        if (hasIndexInformation(physOp))
        {
            $relop.children("IndexScan").children("Object").each(function (index, objectNode)
                {
                    $relopDiv.append(" on ").append(
                        $("<span>").addClass("IndexObject").text(getReferences(objectNode, "Index")));
                });
        }

        if (hasCostInformation(physOp))
        {
            // An individual node's cost is its own subtree cost minus that of the operation directly under it
            var subtreeCost = $relop.attr("EstimatedTotalSubtreeCost");
            $relop.find("RelOp").first().each(function (idx, subop)
                    { subtreeCost -= subop.getAttribute("EstimatedTotalSubtreeCost"); });

            var normSubtreeCost = Math.round(1000 * (subtreeCost / statementCost)) / 10.0;
            if (normSubtreeCost == 0)
            {
                subtreeCost = 0;
            }

            $relopDiv.append(" costing ").append(
                $("<span>").addClass("EstTotalSubtreeCost").text(subtreeCost + " (" + normSubtreeCost + "%)"));
        }

        return $relopDiv;
    };

    var getReferences = function(node, objectName)
    {
        return node.getAttribute("Table").replace(REGEXP_COLS, "$1") + "." +
            node.getAttribute(objectName).replace(REGEXP_COLS, "$1");
    };

    var hasIndexInformation = function(physOp)
    {
        return physOp.indexOf("Index Scan") != -1 || physOp.indexOf("Index Seek") != -1;
    };

    var hasCostInformation = function(physOp)
    {
        return physOp != "Nested Loops";
    };

    window.uploadFile = function()
    {
        var filePicker = document.getElementById("filepicker");
        if (filePicker.files.length != 1) return;
        
        var reader = new FileReader();
        reader.onload = (function (e)
        {
            var xml = $.parseXML(e.target.result);
            var $xml = $(xml);
            $xml.find("Statements > StmtSimple").each(function (index, statement) { processStatement(statement); });
        });
        reader.readAsText(filePicker.files[0]);
    };
})();

