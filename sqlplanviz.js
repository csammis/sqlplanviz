//
// .SqlPlan visualizer
// Copyright (c) 2013, Chris Sammis
// All contents released under the MIT license, http://opensource.org/licenses/MIT
//

function processStatement(node)
{
    var $node = $(node);

    $("#plan").append('<div class="StatementText">' + $node.attr("StatementText") + "</div>");

    $node.find("RelOp").each(
        function (index, relop)
        {
            var html = '<div class="RelOp">Operation: <span class="LogicalOp">' +
                relop.getAttribute("LogicalOp") + '</span> costing <span class="EstTotalSubtreeCost">' +
                relop.getAttribute("EstimatedTotalSubtreeCost") + "</span></div>";
            $("#plan").append(html);
        }
    );
}

function processXml(xmlString)
{
    var  xml = $.parseXML(xmlString);
    var $xml = $(xml);

    $xml.find("Statements > StmtSimple").each(
        function (index, statement)
        {
            processStatement(statement);
        }
    );
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

