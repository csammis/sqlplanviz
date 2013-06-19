//
// .SqlPlan visualizer
// Copyright (c) 2013, Chris Sammis
// All contents released under the MIT license, http://opensource.org/licenses/MIT
//

function processStatement(node)
{
    var $node = $(node);

    $("#plan").append('<div class="StatementText">' + $node.attr("StatementText") + "</div>");

    var html = "";

    // .find returns descendants at all levels but we're only interested in the first under StmtSimple
    $node.find("RelOp").first().each(function (index, relop) { html += processRelOp(relop); });

    $("#plan").append(html);
}

function processRelOp(relop)
{
    var $relop = $(relop);
    var physOp = $relop.attr("PhysicalOp");

    // Build a <div> to represent the RelOp
    var html = '<div class="RelOp">\u21B3 ';
    
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
   
    var nestedHtml = "";
    if (hasNestedRelOps(physOp))
    {
        $relop.find("RelOp").each(function (index, nestedRelOp) { nestedHtml += processRelOp(nestedRelOp); });
    }

    html += 'costing <span class="EstTotalSubtreeCost">' +
        $relop.attr("EstimatedTotalSubtreeCost") + "</span>" + nestedHtml + "</div>";

    return html;
}

function hasIndexInformation(physOp)
{
    return physOp.indexOf("Index Scan") != -1 || physOp.indexOf("Index Seek") != -1;
}

function hasNestedRelOps(physOp)
{
    return physOp.indexOf("Nested Loop") != -1 || physOp == "Top";
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

