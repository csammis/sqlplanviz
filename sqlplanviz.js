//
// .SqlPlan visualizer
// Copyright (c) 2013, Chris Sammis
// All contents released under the MIT license, http://opensource.org/licenses/MIT
//

var INDENT_DIFF = 0.5;

function processStatement(node)
{
    var $node = $(node);

    $("#plan").append('<div class="StatementText">' + $node.attr("StatementText") + "</div>");

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

function debug__printNode(node)
{
    var log = "QueryPlan";
    var depth = 0;
    while (node.parentNode != undefined && node.nodeName != "QueryPlan")
    {
        log = log + " > " + node.nodeName;
        depth++;
        node = node.parentNode;
    }
    console.log("At " + depth + " exists " + log);
}

function getRelOpDetails($relop, indention)
{
    var physOp = $relop.attr("PhysicalOp");

    // Build a <div> to represent the RelOp
    var html = '<div class="RelOp" style="margin-left:' + indention + 'em;">\u21B3 ';
    
    // Build logical operation details
    html += 'Operation: <span class="LogicalOp">' + $relop.attr("LogicalOp");
    if (physOp == "Top")
    {
        $relop.find("Top > TopExpression > ScalarOperator > Const").first().each(
                function (index, constNode) { html += " " + constNode.getAttribute("ConstValue"); });
    }
    html += "</span> ";

    if (hasIndexInformation(physOp))
    {
        // Retrieve information about the index on which the index is scanning
        $relop.children("IndexScan").children("Object").each(
            function (index, object)
            {
                html += 'on <span class="IndexObject">' + object.getAttribute("Index") + "</span> "; 
            }
        );
    }
   
    html += 'costing <span class="EstTotalSubtreeCost">' + $relop.attr("EstimatedTotalSubtreeCost") + "</span></div>";

    return html;
}

function hasIndexInformation(physOp)
{
    return physOp.indexOf("Index Scan") != -1 || physOp.indexOf("Index Seek") != -1;
}

function processXml(xmlString)
{
    var  xml = $.parseXML(xmlString);
    var $xml = $(xml);

    $xml.find("Statements > StmtSimple").each(function (index, statement) { processStatement(statement); });
}

function uploadFile()
{
    var filePicker = document.getElementById("filepicker");
    if (filePicker.files.length != 1) return;
    
    var reader = new FileReader();
    reader.onload = (function (e)
    {
        processXml(e.target.result);
    });
    reader.readAsText(filePicker.files[0]);
}

