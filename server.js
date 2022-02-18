var http = require("http");
var fs = require("fs");
var url = require("url");
var port = process.argv[2];

if (!port) {
  console.log("请指定端口号好不啦？\nnode server.js 8888 这样不会吗？");
  process.exit(1);
}

var server = http.createServer(function (request, response) {
  var parsedUrl = url.parse(request.url, true);
  var pathWithQuery = request.url;
  var queryString = "";
  if (pathWithQuery.indexOf("?") >= 0) {
    queryString = pathWithQuery.substring(pathWithQuery.indexOf("?"));
  }
  var path = parsedUrl.pathname;
  var query = parsedUrl.query;
  var method = request.method;

  /******** 从这里开始看，上面不要看 ************/

  console.log("有个傻子发请求过来啦！路径（带查询参数）为：" + pathWithQuery);

  // 因为很多部分都需要引用
  // 从文件中读取到session，先将其转化为字符串，然后用JSON.parse将其转化为对象
  const sessionObj = JSON.parse(fs.readFileSync("./session.json").toString());

  // --------------------------------------------------------
  // 登录页面设置
  // --------------------------------------------------------

  if (path === "/sign_in.html" && method === "POST") {
    response.setHeader("Content-Type", "text/html;charset=utf-8");
    console.log("这里有运行吗");
    // JSON.parse() 方法用来解析JSON字符串，构造由字符串描述的JavaScript值或对象。
    // 把JSON字符串变成数组
    const userDatabaseArray = JSON.parse(fs.readFileSync("./db/user.json"));

    // 新建一个数组，用来存放数据
    const array = [];

    // 监听请求上的数据
    request.on("data", (chunk) => {
      // 把ajax中的请求中的data数据push到空数组中，这里也就是传输的用户输入的name和password
      array.push(chunk);
    });

    // 如果请求结束了
    request.on("end", () => {
      // 前面的空数组因为添加了请求中的数据，已经变成了<Buffer数据>
      // 现在是将Buffer数据变化成JSON字符串，这是Buffer自己提供的方法，无须深究
      const string = Buffer.concat(array).toString();

      // 然后把JSON字符串变为对象，这里也就是用户输入的数据
      const userInputObj = JSON.parse(string);

      // find方法是返回符合条件的第一个值，如果没有找到就返回undefined
      // 这里是在数据库形成的数组中查找有没有跟用户输入的name和password匹配的内容，如果有就代表这个用户已经注册成功，且输入的name和passport内容没有问题
      const user = userDatabaseArray.find(
        (user) =>
          user.name === userInputObj.name &&
          user.password === userInputObj.password
      );

      console.log("这里有运行吗");

      console.log("user:" + user);

      // 如果没有找到匹配的name和password
      if (user === undefined) {
        // 4开头的都是失败的状态
        response.statusCode = 400;
        response.end("你输入的用户名和密码不匹配");
      } else {
        // 如果找到了
        response.statusCode = 200;
        const random = Math.random();

        // 对象的随机数属性，等于右边
        sessionObj[random] = { user_id: user.id };

        // 然后往session.json中写入第二个参数的内容，即将前面的sessionObj转化为字符串，然后写入session.json文件中
        fs.writeFileSync("./session.json", JSON.stringify(sessionObj));

        response.setHeader("Set-Cookie", `session_id=${random};HttpOnly`);
        response.end();
      }
    });
    // response.end("很好");

    // --------------------------------------------------------
    // home页面
    // --------------------------------------------------------
  } else if (path === "/home.html") {
    const cookie = request.headers["cookie"];
    // const cookieArray = cookie.split(";");

    // let userId;
    let sessionId;
    try {
      sessionId = cookie
        .split(";")
        .filter((s) => s.indexOf("session_id=") >= 0)[0]
        .split("=")[1];
    } catch (error) {}

    // console.log(`userId:` + userId);
    // console.log(cookieArray);
    console.log(`这是cookie: ` + cookie);
    // console.log(`typeOf cookie:` + typeof cookie);

    // 如果sessionId存在,这里是判断cookie里面有没有id
    if (sessionId && sessionObj[sessionId]) {
      const userId = sessionObj[sessionId].user_id;
      const userDatabaseArray = JSON.parse(fs.readFileSync("./db/user.json"));

      const user = userDatabaseArray.find((obj) => obj.id === userId);

      const homeHtml = fs.readFileSync("./public/home.html").toString();
      // 注意：因为userId是string，所以obj.id.toString()与其保持一致

      console.log("user:" + user);
      let string;
      if (user) {
        console.log("这里进行判断了吗？");
        string = homeHtml
          .replace("{{loginStatus}}", "登录成功")
          .replace("{{user.name}}", user.name);
        response.write(string);
      } else {
        string = homeHtml.replace(" {{loginStatus}}", "登录失败");
        response.write(string);
      }
      // console.log("string:" + string);
    } else {
      const homeHtml = fs.readFileSync("./public/home.html").toString();
      string = homeHtml
        .replace(" {{loginStatus}}", "登录失败")
        .replace("{{user.name}}", "");
      response.write(string);
    }
    response.end("响应结束");

    // response.end("web page content");
    // loginStatus=1

    // --------------------------------------------------------
    // 注册页面设置
    // --------------------------------------------------------
  } else if (path === "/register" && method === "POST") {
    response.setHeader("Content-Type", "text/html;charset=utf-8");
    // 新建一个数组，用来存放数据
    const array = [];

    // JSON.parse() 方法用来解析JSON字符串，构造由字符串描述的JavaScript值或对象。
    const userArray = JSON.parse(fs.readFileSync("./db/user.json"));

    // 监听请求上的数据
    request.on("data", (chunk) => {
      // 把ajax中的请求中的数据push到空数组中
      array.push(chunk);
    });

    // 如果请求结束了
    request.on("end", () => {
      // 前面的array因为添加了请求中的数据，已经变成了<Buffer数据>
      // 现在是将Buffer数据变化成JSON字符串，这是Buffer自己提供的方法
      const string = Buffer.concat(array).toString();
      console.log(string);

      // JSON.parse() 方法用来解析JSON字符串，构造由字符串描述的JavaScript值或对象。
      const obj = JSON.parse(string);

      // 例如arr = [0,1,2,3,4];  arr[arr.length - 1]这就得到了最大的那个值
      // 同理，因为userArray中是数组中包含了几个对象，那么下面这样就得到最后一个对象的id，然后再将这个id+1,就生成了最新的id

      const lastUser = userArray[userArray.length - 1];

      const newUser = {
        //  新用户的id为最后一个用户的id+1, 如果不存在，那么就为1
        id: lastUser ? lastUser.id + 1 : 1,
        name: obj.name,
        password: obj.password,
      };
      // 把这个newUser数据写入数据库生成的那个JSON数组中
      userArray.push(newUser);
      // 然后把userArray重新变成json字符串,写入数据库当中
      fs.writeFileSync("./db/user.json", JSON.stringify(userArray));
    });

    response.end("很好");

    // --------------------------------------------------------
    // 其他基本页面设置
    // --------------------------------------------------------
  } else {
    response.statusCode = 200;

    let filePath = path;
    // 判断路径是否为根目录/ 如果是的话就默认为/index.html
    filePath = filePath === "/" ? "/index.html" : path;

    const index = filePath.lastIndexOf(".");

    // suffix是后缀，从index位开始裁剪后面的部分，比如.style/.css
    const suffix = filePath.substring(index);
    const fileType = {
      ".html": "text/html",
      ".css": "text/css",
      ".js": "text/javascript",
      ".png": "image/png",
      ".jpg": "image/jpeg",
    };

    console.log(fileType[suffix]);
    response.setHeader(
      "Content-Type",
      `${fileType[suffix] || "text/html"};charset=utf-8`
    );

    let content;
    try {
      content = fs.readFileSync(`./public${filePath}`);
    } catch (error) {
      response.statusCode = 404;
      content = "404";
    }

    response.write(content);
    response.end();
  }

  // if (path === "/") {
  //   response.statusCode = 200;
  //   response.setHeader("Content-Type", "text/html;charset=utf-8");
  //   response.write(`二哈`);
  //   response.end();
  // } else if (path === "/index.html") {
  //   response.statusCode = 200;
  //   response.setHeader("Content-Type", "text/html;charset=utf-8");
  //   response.write(fs.readFileSync(`./public/index.html`));
  //   response.end();
  // } else if (path === "/style.css") {
  //   response.statusCode = 200;
  //   response.setHeader("Content-Type", "text/css;charset=utf-8");
  //   response.write(fs.readFileSync(`./public/style.css`));
  //   response.end();
  // } else if (path === "/main.js") {
  //   response.statusCode = 200;
  //   response.setHeader("Content-Type", "text/javascript;charset=utf-8");
  //   response.write(fs.readFileSync(`./public/main.js`));
  //   response.end();
  // } else {
  //   response.statusCode = 404;
  //   response.setHeader("Content-Type", "text/html;charset=utf-8");
  //   response.write(`你输入的路径不存在对应的内容`);
  //   response.end();
  // }

  /******** 代码结束，下面不要看 ************/
});

server.listen(port);
console.log(
  "监听 " +
    port +
    " 成功\n请用在空中转体720度然后用电饭煲打开 http://localhost:" +
    port
);
