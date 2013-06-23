//
// .SqlPlan visualizer
// Copyright (c) 2013, Chris Sammis
// All contents released under the MIT license, http://opensource.org/licenses/MIT
//

var INDENT_DIFF = 0.5;
var REGEXP_COLS = /\[(.+?)\]/;

function processStatement(node)
{
    var $node = $(node);

    $("#plan")
        .empty()
        .append('<div class="StatementText">' + $node.attr("StatementText") + "</div>");

    var lastDepth = 0;
    var lastDepthEm = 0;
    $node.find("RelOp").each(function (index, relop)
    {
        var $relop = $(relop);
        var depth = $relop.parents().length;

        if (depth < lastDepth)
        {
            lastDepthEm -= INDENT_DIFF;
        }
        else if (depth > lastDepth)
        {
            lastDepthEm += INDENT_DIFF;
        }
        lastDepth = depth;

        $("#plan").append(getRelOpDetails($relop, lastDepthEm)); 
    });
}

function getRelOpDetails($relop, indention)
{
    var physOp = $relop.attr("PhysicalOp");

    var html = '<div class="RelOp" style="margin-left:' + indention + 'em;">\u21B3 ';
    html += '<span class="LogicalOp">' + $relop.attr("LogicalOp");
    
    // **** TOP
    if (physOp == "Top")
    {
        $relop.find("Top > TopExpression > ScalarOperator > Const").first().each(
                function (index, constNode) { html += " " + constNode.getAttribute("ConstValue"); });
    }
    html += "</span> ";

    // **** SORT
    if (physOp == "Sort")
    {
        $relop.find("ColumnReference").first().each(
            function (index, sortNode)
            {
                html += 'on <span class="ColumnReference">' + getReferences(sortNode, "Column") + "</span> ";
            }
        );
    }

    // **** INDEX SEEK/SCAN
    if (hasIndexInformation(physOp))
    {
        $relop.children("IndexScan").children("Object").each(
            function (index, objectNode)
            {
                html += 'on <span class="IndexObject">' + getReferences(objectNode, "Index") + "</span> "; 
            }
        );
    }
   
    html += 'costing <span class="EstTotalSubtreeCost">' + $relop.attr("EstimatedTotalSubtreeCost") + "</span></div>";
    return html;
}

function getReferences(node, objectName)
{
    return node.getAttribute("Table").replace(REGEXP_COLS, "$1") + "." +
        node.getAttribute(objectName).replace(REGEXP_COLS, "$1");
}

function hasIndexInformation(physOp)
{
    return physOp.indexOf("Index Scan") != -1 || physOp.indexOf("Index Seek") != -1;
}

function uploadFile()
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
}

