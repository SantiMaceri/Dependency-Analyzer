const express = require("express");
const app = express();
const port = 4000;
const https = require("https");
const cheerio = require("cheerio");
const csv = require("csv-parser");
const fs = require("fs");
const getStream = require("get-stream");
const fsp = require("fs").promises;
const CSVFILE = "sites.csv";

app.listen(port, () =>
  console.log(`Dependency Analyzer listening on port ${port}!`)
);

const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const csvWriter = createCsvWriter({
  path: CSVFILE,
  header: [
    { id: "name", title: "Name" },
    { id: "source", title: "Source" },
  ],
});

const data = [
  {
    name: "Facebook",
    source: "https://www.facebook.com",
  },
  {
    name: "Clarin",
    source: "./clarin/index.html",
  },
  {
    name: "La Nacion",
    source: "https://www.lanacion.com.ar/",
  },
  {
    name: "Trello",
    source: "./trello/index.html",
  },
];

app.get("/create", (req, res) => {
  csvWriter.writeRecords(data).then(() => res.send("Welcome, csv created!"));
});

app.get("/content-lengths", async (req, res) => {
  if (fs.existsSync(CSVFILE)) {
    output = await contentLenghts(CSVFILE);
  } else {
    output = CSVFILE + " does not exist! Use /create to magically create one!";
  }
  res.send(output);
});

contentLenghts = async (filePath) => {
  const output = [];
  const rows = await readCSVData(filePath);
  for (let row of rows) {
    await getContentLength(row, output);
  }
  return output;
};

readCSVData = async (filePath) => {
  const parseStream = csv({ delimiter: "," });
  const data = await getStream.array(
    fs.createReadStream(filePath).pipe(parseStream)
  );
  return data;
};

getContentLength = async (row, output) => {
  if (!(row.Source.charAt(0) === ".")) {
    const html = await makeSynchronousRequest(row.Source);
    const size = encodeURI(html).split(/%..|./).length - 1;
    output.push({ Name: row.Name, Size: size });
  } else {
    if (fs.existsSync(row.Source)) {
      const stats = fs.statSync(row.Source);
      const fileSizeInBytes = stats.size;
      output.push({ Name: row.Name, Size: fileSizeInBytes });
    } else {
      output.push({ Name: row.Name, msg: "file does not exist" });
    }
  }
};

app.get("/dependencies", async (req, res) => {
  if (fs.existsSync(CSVFILE)) {
    output = await deps(CSVFILE);
  } else {
    output = CSVFILE + " does not exist! Use /create to magically create one!";
  }
  res.send(output);
});

isJs = (filename) => {
  return /\.js$/i.test(filename);
};

deps = async (filePath) => {
  const output = [];
  const rows = await readCSVData(filePath);
  for (let row of rows) {
    await checkDependencies(row, output);
  }
  return output;
};

checkDependencies = async (row, output) => {
  if (!(row.Source.charAt(0) === ".")) {
    const html = await makeSynchronousRequest(row.Source);
    if (html == "") {
      output.push({ Name: row.Name, msg: "No html" });
    } else {
      addDependenciesFromHtml(row, html, output);
    }
  } else {
    if (fs.existsSync(row.Source)) {
      html = await fsp.readFile(row.Source, "utf-8");
      addDependenciesFromHtml(row, html, output);
    } else {
      output.push({ Name: row.Name, msg: "file does not exist" });
    }
  }
};

addDependenciesFromHtml = (row, html, output) => {
  const $ = cheerio.load(html);
  const headTags = [];
  $("head > *").each((_, elm) => {
    headTags.push({
      name: elm.name,
      attribs: elm.attribs,
      text: $(elm).text(),
    });
  });
  const dependencies = headTags.filter((tag) => {
    return tag.name == "script" && isJs(tag.attribs.src);
  });
  dependencies.forEach((dep) => {
    output.push({ Name: row.Name, dependency: dep.attribs.src });
  });
};

getPromise = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      let chunks_of_data = [];

      response.on("data", (fragments) => {
        chunks_of_data.push(fragments);
      });

      response.on("end", () => {
        let response_body = Buffer.concat(chunks_of_data);
        resolve(response_body.toString());
      });

      response.on("error", (error) => {
        reject(error);
      });
    });
  });
};

makeSynchronousRequest = async (url) => {
  try {
    let http_promise = getPromise(url);
    let response_body = await http_promise;

    // holds response from server that is passed when Promise is resolved
    return response_body;
  } catch (error) {
    // Promise rejected
    console.log(error);
  }
};

app.get("/frequency", async (req, res) => {
  if (fs.existsSync(CSVFILE)) {
    output = await freq(CSVFILE);
  } else {
    output = CSVFILE + " does not exist! Use /create to magically create one!";
  }
  res.send(output);
});

freq = async (filePath) => {
  const output = {};
  const rows = await readCSVData(filePath);
  for (let row of rows) {
    await checkFrequency(row, output);
  }
  return output;
};

checkFrequency = async (row, output) => {
  if (!(row.Source.charAt(0) === ".")) {
    const html = await makeSynchronousRequest(row.Source);
    addDependenciesFrequencyFromHtml(row, html, output);
  } else {
    if (fs.existsSync(row.Source)) {
      html = await fsp.readFile(row.Source, "utf-8");
      addDependenciesFrequencyFromHtml(row, html, output);
    }
  }
};

addDependenciesFrequencyFromHtml = (row, html, output) => {
  const $ = cheerio.load(html);
  const headTags = [];
  $("head > *").each((_, elm) => {
    headTags.push({
      name: elm.name,
      attribs: elm.attribs,
      text: $(elm).text(),
    });
  });
  const dependencies = headTags.filter((tag) => {
    return tag.name == "script" && isJs(tag.attribs.src);
  });
  dependencies.forEach((dep) => {
    output[dep.attribs.src] = (output[dep.attribs.src] || 0) + 1;
  });
};
