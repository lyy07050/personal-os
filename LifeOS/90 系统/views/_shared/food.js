// 食物图标：有手绘贴纸（90 系统/附件/food/<名字>.png）就用贴纸，没有就用浅色圆底 emoji。
// 用法（在 view.js 里）：const { foodIcon } = eval(await dv.io.load("90 系统/views/_shared/food.js"));
// 整个文件是一个表达式，eval 的结果就是导出的对象。
(() => {
  const DIR = "90 系统/附件/food/";
  const FOOD_STICKERS = new Set(["三文鱼", "三文鱼寿司", "可颂", "吐司面包", "哈密瓜", "大蒜", "奶酪", "小番茄", "小葱", "布里奶酪", "开心果", "意面", "披萨", "挂面", "曲奇", "木瓜", "果酱", "柠檬", "树莓", "桃子", "梨", "椰子", "樱桃", "橄榄油", "橘子", "橙子", "橙汁", "沙丁鱼", "洋葱", "洋蓟", "炖牛肉", "焗豆", "牛奶", "牛排", "牛油果", "牛油果吐司", "牛肉", "猕猴桃", "玉米", "甜椒", "生抽", "番茄", "番茄罐头", "盐", "石榴", "红洋葱", "红茶", "红酒", "罗勒", "胡萝卜", "芦笋", "芹菜", "苹果", "草莓", "菠菜", "蓝纹奶酪", "蓝莓", "虾", "蛋黄酱", "蜂蜜", "西兰花", "西柚", "西瓜", "辣椒", "通心粉", "酸奶", "酸黄瓜", "青柠", "青椒", "食用油", "香蕉", "鸡腿肉", "鸡蛋", "黄油", "黄瓜"]);
  const FOOD_EMOJI = { "酸奶": "🥛", "嫩豆腐": "🧈", "豆腐": "🧈", "饺子": "🥟", "汤圆": "🍡", "大米": "🍚", "泡面": "🍜", "鸡腿肉": "🍗", "花生酱": "🥜", "燕麦": "🌾", "挂面": "🍜", "冻虾": "🦐" };
  const FOOD_ALIAS = { "冻虾": "虾", "鸡肉": "鸡腿肉" };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  // Obsidian 里图片要换成 app:// 资源地址；在 node 测试里没有 app，就原样返回路径
  const resource = (path) => (typeof app !== "undefined" && app.vault ? app.vault.adapter.getResourcePath(path) : path);

  function foodIcon(name, size = 56) {
    const alias = FOOD_ALIAS[name];
    const key = alias && FOOD_STICKERS.has(alias) ? alias : name;
    if (FOOD_STICKERS.has(key)) {
      return `<img class="food-img" src="${esc(resource(DIR + key + ".png"))}" alt="" style="max-width:${size * 1.4}px;max-height:${size}px">`;
    }
    const e = FOOD_EMOJI[name] || "🍽️";
    return `<span class="food-emoji" aria-hidden="true" style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.52)}px">${e}</span>`;
  }

  return { foodIcon, FOOD_STICKERS, FOOD_EMOJI, FOOD_ALIAS };
})()
