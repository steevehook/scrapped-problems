import puppeteer from 'puppeteer'
import fetch from "node-fetch";
import fs from 'fs'

(async () => {
  const host = 'https://projecteuler.net'
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  for (let i = 1; i <= 763; i++) {
    console.log(`scrapping: ${host}/problem=${i}`);
    await page.goto(`${host}/problem=${i}`);
    await page.waitForTimeout(1000);

    let problem = await page.evaluate(() => {
      let els = document.querySelectorAll('#problem_icons, .no_border')
      for (let i = 0; i < els.length; i++) {
        els[i].parentNode.removeChild(els[i]);
      }

      let images = []
      Array.from(document.querySelectorAll('.problem_content img')).map(img => {
        let src = img.src
        let srcArray = src.split('/')
        let pos = srcArray.length - 1
        let filename = srcArray[pos]
        images.push({
          src,
          filename
        })
      })
      let title = document.querySelectorAll('#content h2')[0].innerText
      let body = document.querySelectorAll('#content')[0].innerHTML.replace(/<img [^>]*src=['"]([^'"]+)[^>]*>/gi, function (match) {
        return match.replace(/<img([^>]*)\ssrc=(['"])(?:[^\2\/]*\/)*([^\2]+)\2/gi, "<img$1 src=$2images/$3$2");
      }).trim();
      let text = `<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport"
          content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>${title}</title>
    <link rel="stylesheet" href="css/style.css">
    <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
    <script id="MathJax-script" async
            src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js">
    </script>
</head>
<body>
<div id="container">
${body}
</div>
</body>
</html>
`

      return {
        images,
        title,
        text
      }
    })

    problem.images.map((image) => {
      let filename = `./problems/euler/images/${image.filename}`
      saveImageToDisk(image.src, filename)
    })

    let title = problem.title.replaceAll('\n', '').replaceAll('.', '').replaceAll('/', '-slash-').trim()
    fs.writeFileSync(`problems/euler/problem-${i}-${title}.html`, problem.text.trim() + '\n');
  }

  await browser.close();
})();

function saveImageToDisk(url, filename) {
  fetch(url)
    .then(res => {
      const dest = fs.createWriteStream(filename);
      res.body.pipe(dest)
    })
    .catch((err) => {
      console.log(err)
    })
}
