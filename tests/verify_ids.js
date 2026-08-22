
const fs = require("fs");
const path = require("path");

const html = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
const appJs = fs.readFileSync(path.join(__dirname, "../app.js"), "utf8");
const gameJs = fs.readFileSync(path.join(__dirname, "../game.js"), "utf8");

const expectedIds = ["homeScreen", "challengeScreen", "gameScreen", "resultScreen"];

console.log("--- 檢查 HTML 中的 ID ---");
expectedIds.forEach(id => {
    if (html.includes(`id="${id}"`)) {
        console.log(`[OK] HTML 包含 ID: ${id}`);
    } else {
        console.error(`[FAIL] HTML 缺失 ID: ${id}`);
    }
});

console.log("\n--- 檢查 app.js 中的 ID 使用 ---");
expectedIds.forEach(id => {
    if (appJs.includes(`"${id}"`) || appJs.includes(`'${id}'`)) {
        console.log(`[OK] app.js 使用了 ID: ${id}`);
    } else {
         console.error(`[FAIL] app.js 缺失對 ID 的使用: ${id}`);
    }
});

console.log("\n--- 檢查 game.js 中的 ID 使用 ---");
expectedIds.forEach(id => {
    if (gameJs.includes(`"${id}"`) || gameJs.includes(`'${id}'`)) {
        console.log(`[OK] game.js 使用了 ID: ${id}`);
    } else {
         console.error(`[FAIL] game.js 缺失對 ID 的使用: ${id}`);
    }
});

const appMismatches = expectedIds.filter(id => !appJs.includes(`"${id}"`) && !appJs.includes(`'${id}'`));
const gameMismatches = expectedIds.filter(id => !gameJs.includes(`"${id}"`) && !gameJs.includes(`'${id}'`));

if (appMismatches.length > 0 || gameMismatches.length > 0) {
    console.error("\n[RESULT] 仍有不匹配！");
    process.exit(1);
} else {
    console.log("\n[RESULT] 所有 ID 匹配成功！");
}
