// 食物贴纸：有手绘贴纸的用贴纸（assets/food/<名字>.png），没有的用浅色圆底 emoji 补上。
window.FOOD_STICKERS=new Set(["三文鱼", "三文鱼寿司", "可颂", "吐司面包", "哈密瓜", "大蒜", "奶酪", "小番茄", "小葱", "布里奶酪", "开心果", "意面", "披萨", "挂面", "曲奇", "木瓜", "果酱", "柠檬", "树莓", "桃子", "梨", "椰子", "樱桃", "橄榄油", "橘子", "橙子", "橙汁", "沙丁鱼", "洋葱", "洋蓟", "炖牛肉", "焗豆", "牛奶", "牛排", "牛油果", "牛油果吐司", "牛肉", "猕猴桃", "玉米", "甜椒", "生抽", "番茄", "番茄罐头", "盐", "石榴", "红洋葱", "红茶", "红酒", "罗勒", "胡萝卜", "芦笋", "芹菜", "苹果", "草莓", "菠菜", "蓝纹奶酪", "蓝莓", "虾", "蛋黄酱", "蜂蜜", "西兰花", "西柚", "西瓜", "辣椒", "通心粉", "酸奶", "酸黄瓜", "青柠", "青椒", "食用油", "香蕉", "鸡腿肉", "鸡蛋", "黄油", "黄瓜"]);
window.FOOD_EMOJI={"酸奶":"🥛","嫩豆腐":"🧈","豆腐":"🧈","饺子":"🥟","汤圆":"🍡","大米":"🍚","泡面":"🍜","鸡腿肉":"🍗","花生酱":"🥜","燕麦":"🌾","挂面":"🍜","冻虾":"🦐"};
window.FOOD_ALIAS={"冻虾":"虾","鸡肉":"鸡腿肉"};
window.foodIcon=function(name,size){
  size=size||56;const key=FOOD_ALIAS[name]&&FOOD_STICKERS.has(FOOD_ALIAS[name])?FOOD_ALIAS[name]:name;
  if(FOOD_STICKERS.has(key))return `<img class="food-img" src="assets/food/${encodeURIComponent(key)}.png" alt="" style="max-width:${size*1.4}px;max-height:${size}px">`;
  const e=FOOD_EMOJI[name]||'🍽️';
  return `<span class="food-emoji" aria-hidden="true" style="width:${size}px;height:${size}px;font-size:${Math.round(size*.52)}px">${e}</span>`;
};
// 页面里 <span data-food="名字" data-size="40"></span> 会自动换成图标
document.querySelectorAll('[data-food]').forEach(el=>{el.innerHTML=foodIcon(el.dataset.food,+el.dataset.size||56);});
