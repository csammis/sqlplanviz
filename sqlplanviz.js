//
// .SqlPlan visualizer
//
//
//
//

function processXml(xml)
{
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

