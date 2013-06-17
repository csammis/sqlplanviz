//
// .SqlPlan visualizer
// Copyright (c) 2013, Chris Sammis
// All contents released under the MIT license, http://opensource.org/licenses/MIT
//

function processStatement(node)
{
    $("#plan").append('<div class="StatementText">' + node.getAttribute("StatementText") + "</div>");

    var relopNodes = node.getElementsByTagName("RelOp");
    for (var i = 0; i < relopNodes.length; i++)
    {
        var node = relopNodes[i];
        var html = '<div class="RelOp">Operation: <span class="LogicalOp">' +
            node.getAttribute("LogicalOp") + '</span> costing <span class="EstTotalSubtreeCost">' +
            node.getAttribute("EstimatedTotalSubtreeCost") + "</span></div>";

        $("#plan").append(html);
    }
}

function processXml(xmlString)
{
    var xml = $.parseXML(xmlString);
    $xml = $(xml);

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

