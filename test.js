const fs = require("fs");

// 读数据库
const userJson = fs.readFileSync("./db/user.json");
// 先把字节内容转化为字符串
const userJsonToString = fs.readFileSync("./db/user.json").toString();
const userJsonArray = JSON.parse(userJsonToString);

// 写数据库
const user3 = { id: 4, name: "Jack", password: "yyy" };
userJsonArray.push(user3);

// 怎么把添加进的数组，变成node
// 把字符串重新变成json
const string = JSON.stringify(userJsonArray);

// 第一个参数是要写入的的文件路径，第二个参数是要写入的数据
fs.writeFileSync("./db/user.json", string);
