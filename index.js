const express = require("express"),
      app = express(),
      fs = require("fs"),
      path = require("path"),
      lighthouse = require('lighthouse'),
      chromeLauncher = require('chrome-launcher'),
      port = 3001;

app.use(express.static('.\\'))

var perfFileListData = [];


app.get("/", (req, res) => {
    res.send("Hello World");
});

app.get("/generateFileList", (req, res) => {
    perfFileListData = [];
    getFileList("./public", perfFileListData);
    console.log("can you check", perfFileListData);
    res.send(perfFileListData);
});

app.get("/generateLightHouseReport", (req, res) => {
    console.log("Hit here");
    console.log("here check list ", perfFileListData);

    
    perfFileListData.filter(fileEntry => fileEntry.includes("lhreport") === false).forEach(perfFileURL => { (async (perfFile) => {
        var chrome = await chromeLauncher.launch({chromeFlags: ['--headless']});
        var options = {logLevel: 'info', output: 'html', onlyCategories: ['performance'], port: chrome.port};
        console.log("ceheck here url", `http:\\localhost:${port}\\${perfFile}`);
        var runnerResult = await lighthouse(`http:\\localhost:${port}\\${perfFile}`, options);
      
        // `.report` is the HTML report as a string
        var reportHtml = runnerResult.report;
        fs.writeFileSync(path.dirname(perfFile) + "\\" + 'lhreport.html', reportHtml);
      
        await chrome.kill();
        // `.lhr` is the Lighthouse Result as a JS object
        console.log('Report is done for', runnerResult.lhr.finalUrl);
        console.log('Performance score was', runnerResult.lhr.categories.performance.score * 100);
      
        
      })(perfFileURL);

    });
    
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});

async function getFileList(fileEntry, fileListData) {
    fs.readdir(fileEntry, {withFileTypes: false}, (err, result) => {
        console.log("here1", result);
        result.forEach(filePath => {
            console.log("here 2", fileEntry + "/" + filePath);

            if(fs.lstatSync(fileEntry + "/" + filePath).isFile() && path.extname(fileEntry + "/" + filePath) === ".html") {
                // Add the file path in array list of html file
                fileListData.push(fileEntry + "/" + filePath)
            } else if(fs.lstatSync(fileEntry + "/" + filePath).isDirectory())  {
                //call recursive
                getFileList(fileEntry + "/" + filePath, fileListData)
            }
            console.log("check here too", fileListData)
            // fs.lstat(filePath, (err, stats) => {
            //     console.log("here 3", filePath,stats)
            //     if(stats.isFile() && path.extname(filePath) === ".html") {
            //        // Add the file path in array list of html file
            //         fileListData.push(filePath)
            //     } else if(stats.isDirectory())  {
            //         //call recursive
            //         getFileList(fileEntry + "/" + filePath, fileListData)
            //     }
            // })
        });
        
    });
};

