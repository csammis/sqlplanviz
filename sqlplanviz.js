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

        $("#StatementText").text($node.attr("StatementText"));

        statementCost = $node.attr("StatementSubTreeCost");

        var lastDepth = 0;
        var lastDepthEm = -1 * INDENT_DIFF;

        $("#RelOps").empty();
        $node.find("RelOp").each(function (index, relop)
        {
            var $relop = $(relop);

            var depth = $relop.parents().length;
            lastDepthEm += (depth > lastDepth) ?      INDENT_DIFF :
                           (depth < lastDepth) ? -1 * INDENT_DIFF : 0;
            lastDepth = depth;

            $("#RelOps").append(getRelOpDetails($relop, lastDepthEm)); 
        });
    };

    var getRelOpDetails = function($relop, indention)
    {
        var physOp = $relop.attr("PhysicalOp");
        var logop = $relop.attr("LogicalOp");

        // Create a <div> to represent the relop, add classes and effects
        var $relopDiv = $("<div>");
        $relopDiv.addClass("RelOp").addClass("RelOp" + $relop.attr("NodeId")).addClass("OpLevel" + indention);
        $relop.parents("RelOp").first().each(function (idx, ancestor) 
                { $relopDiv.addClass("ChildOf" + ancestor.getAttribute("NodeId")); });
        if (physOp == "Nested Loops")
        {
            $relopDiv.hover(
                    function () { $(this).addClass("JoinedRelOp");
                                  $(".ChildOf" + $relop.attr("NodeId")).addClass("JoinedRelOp"); },
                    function () { $(this).removeClass("JoinedRelOp");
                                  $(".ChildOf" + $relop.attr("NodeId")).removeClass("JoinedRelOp"); });

        }

        // Insert <span> to indent the operation
        var $spacing = $("<span>").addClass("RelOpSpacing");
        for (var i = 0; i < indention; i++)
        {
            $spacing.text($spacing.text() + "\u00A0");
        }
        $relopDiv.append($spacing);
        
        // **** TOP (as part of the logical operation)
        var $logop = $("<span>").addClass("LogicalOp").text($relop.attr("LogicalOp"));
        if (physOp == "Top")
        {
            $relop.find("Top > TopExpression > ScalarOperator > Const").first().each(
                    function (index, constNode) { $logop.text($logop.text() + " " + constNode.getAttribute("ConstValue")); });
        }
        $relopDiv.append(" \u21B3 ").append($logop);

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

