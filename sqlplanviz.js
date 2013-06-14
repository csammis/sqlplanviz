//
// .SqlPlan visualizer
// Copyright (c) 2013, Chris Sammis
// All contents released under the MIT license, http://opensource.org/licenses/MIT
//

function processStatement(node)
{
    var plan = document.getElementById("plan");
    plan.innerHTML += "<span>" + node.getAttribute("StatementText") + "</span><br />";

    var relopNodes = node.getElementsByTagName("RelOp");
    for (var i = 0; i < relopNodes.length; i++)
    {
        var node = relopNodes[i];
        plan.innerHTML += "<span>Operation: " + node.getAttribute("LogicalOp") 
            + " costing " + node.getAttribute("EstimatedTotalSubtreeCost") + "</span><br />";
    }
}

function processXml(xml)
{
    var stmtsNode = xml.getElementsByTagName("Statements");
    if (stmtsNode)
    {
        var statementNodes = stmtsNode[0].childNodes;
        for (var i = 0; i < statementNodes.length; i++)
        {
            var statement = statementNodes[i];
            if (statement.nodeType == Node.TEXT_NODE) continue;
            processStatement(statement);
        }
    }
}

function uploadFile()
{
    var filePicker = document.getElementById("filepicker");
    if (filePicker.files.length != 1) return;
    
    var reader = new FileReader();
    reader.onload = (function (e)
    {
        var parser = new DOMParser();
        var doc = parser.parseFromString(e.target.result, "text/xml");
        processXml(doc);
    });
    reader.readAsText(filePicker.files[0]);
}

